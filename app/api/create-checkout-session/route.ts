export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/app/lib/prisma";
import { foxpostFetch } from "@/app/lib/foxpostClient";
import { resolveFoxpostPickup } from "@/app/lib/foxpostPickup";
import type { OrderEmailInput } from "@/app/lib/email/templates/orderCustomer";
import { resolveProductId } from "@/app/lib/productCatalog";
import {
  assertPendingOrderRateLimit,
  computeOrderTotals,
  MAX_NOTE_LENGTH,
  normalizeCartLines,
  normalizeShippingMethod,
  resolveStripeShippingPriceId,
  sanitizeAddress,
  sanitizeEmail,
  sanitizePhone,
  sanitizeText,
  validateCheckoutOrigin,
  resolveFoxpostFulfillmentMethod,
} from "@/app/lib/checkoutSecurity";
import { isShopProductListed } from "@/app/lib/shopProduct";
import { normHuPhone } from "@/app/lib/phone";

type Address = {
  name?: string;
  email?: string;
  phone?: string;
  zip?: string | number;
  city?: string;
  address?: string;
};

type BodyShape = {
  items: Array<{ id?: string; quantity?: number; qty?: number }>;
  customer?: {
    email?: string;
    phone?: string;
    billing?: Address;
    shippingAddress?: Address;
  };
  shippingMethod?: string;
  pickupPoint?: { id?: string } | null;
  note?: string;
  paymentHint?: string;
  acceptTos?: boolean;
};

function genOrderNo(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rnd = Math.floor(Math.random() * 900000 + 100000);
  return `ORD-${y}${m}${day}-${rnd}`;
}

function isSandboxFoxpost(): boolean {
  return (process.env.FOXPOST_BASE_URL || "").includes("webapi-test");
}

async function createFoxpostParcelCOD(params: {
  shippingMethod: string;
  pickupPointId: string;
  orderNo: string;
  totalHUF: number;
  email: string;
  billing: Address;
  shipping: Address;
  note: string;
}): Promise<string | null> {
  const { shippingMethod, pickupPointId, orderNo, totalHUF, email, billing, shipping, note } = params;
  const size = "M";
  const recipientName = shipping.name || billing.name || "N/A";
  const recipientEmail = email || billing.email || shipping.email || "";
  const recipientPhone = normHuPhone(shipping.phone || billing.phone);

  let item: Record<string, unknown>;

  const fulfillmentMethod = resolveFoxpostFulfillmentMethod(shippingMethod);
  if (!fulfillmentMethod) {
    return null;
  }

  if (fulfillmentMethod === "foxpost_locker") {
    if (!pickupPointId) throw new Error("Hiányzik a pickupPointId lockerhez.");
    item = {
      recipientName,
      recipientEmail,
      recipientPhone,
      destination: pickupPointId,
      size,
      refCode: orderNo,
      cod: totalHUF,
      ...(note ? { comment: note.slice(0, 50) } : {}),
    };
  } else if (fulfillmentMethod === "foxpost_home") {
    if (!shipping.zip || !shipping.city || !shipping.address) {
      throw new Error("Hiányos cím házhozszállításhoz (zip/city/address).");
    }
    item = {
      recipientName,
      recipientEmail,
      recipientPhone,
      recipientZip: String(shipping.zip),
      recipientCity: shipping.city,
      recipientAddress: shipping.address,
      recipientCountry: "HU",
      size,
      refCode: orderNo,
      cod: totalHUF,
      ...(note ? { comment: note.slice(0, 50) } : {}),
    };
  } else {
    return null;
  }

  const query = isSandboxFoxpost() ? "?isWeb=false" : "";
  const res = await foxpostFetch(`/parcel${query}`, {
    method: "POST",
    body: JSON.stringify([item]),
  });

  const raw = await res.text();
  if (res.status !== 201) {
    console.error("Foxpost /parcel error:", res.status, raw);
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "[]");
  } catch {
    return null;
  }

  const first = Array.isArray(parsed)
    ? (parsed[0] as Record<string, unknown>)
    : (parsed as Record<string, unknown>);
  return ((first?.clFoxId as string | undefined) || (first?.barcodeTof as string | undefined) || null) as string | null;
}

export async function POST(req: Request) {
  try {
    if (!validateCheckoutOrigin(req)) {
      return NextResponse.json({ error: "Érvénytelen kérés forrása." }, { status: 403 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Hiányzik a STRIPE_SECRET_KEY." }, { status: 500 });
    }

    const body: BodyShape = await req.json();
    if (!body.acceptTos) {
      return NextResponse.json({ error: "Az ÁSZF elfogadása kötelező." }, { status: 400 });
    }

    const lines = normalizeCartLines(body.items, resolveProductId);
    const productIds = [...new Set(lines.map((line) => line.productId))];

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true, priceHUF: true, stock: true, stripePriceId: true },
    });

    const byId = new Map(products.map((p) => [p.id, p]));
    const missing = productIds.filter((id) => !byId.has(id));
    if (missing.length) {
      return NextResponse.json(
        { error: "Ismeretlen termék(ek) a kosárban.", missingProductIds: missing },
        { status: 400 }
      );
    }

    const unavailable = productIds.filter((id) => !isShopProductListed(id));
    if (unavailable.length) {
      return NextResponse.json(
        {
          error:
            "Egy vagy több termék jelenleg nem rendelhető a webshopból. Távolítsd el a kosárból, majd próbáld újra.",
          unavailableProductIds: unavailable,
        },
        { status: 400 }
      );
    }

    const shippingMethod = normalizeShippingMethod(body.shippingMethod);
    const pickupPointId = sanitizeText(body.pickupPoint?.id, 64);
    const paymentHintRaw = sanitizeText(body.paymentHint ?? "card", 24).toLowerCase();
    const paymentMethod =
      paymentHintRaw === "transfer" || paymentHintRaw === "bank_transfer"
        ? "transfer"
        : paymentHintRaw === "cod"
        ? "cod"
        : "card";
    const isOfflinePayment = paymentMethod === "transfer" || paymentMethod === "cod";
    const note = sanitizeText(body.note, MAX_NOTE_LENGTH);

    const userEmail = sanitizeEmail(body.customer?.email);
    if (!userEmail) {
      return NextResponse.json({ error: "Érvénytelen e-mail cím." }, { status: 400 });
    }

    const customerPhone = sanitizePhone(body.customer?.phone);
    if (customerPhone.replace(/\D/g, "").length < 6) {
      return NextResponse.json({ error: "Érvénytelen telefonszám." }, { status: 400 });
    }

    if (shippingMethod === "foxpost_locker" && !pickupPointId) {
      return NextResponse.json({ error: "Válassz csomagautomatát." }, { status: 400 });
    }

    const billing = sanitizeAddress(body.customer?.billing, userEmail, customerPhone);
    const shippingAddr = sanitizeAddress(
      body.customer?.shippingAddress ?? body.customer?.billing,
      userEmail,
      customerPhone
    );

    if (!billing.name || !billing.zip || !billing.city || !billing.address) {
      return NextResponse.json({ error: "Hiányos számlázási cím." }, { status: 400 });
    }

    const productMap = new Map(
      products.map((p) => [p.id, { priceHUF: Number(p.priceHUF), stock: Number(p.stock) }])
    );

    const { subtotalHUF, shippingHUF, discountHUF, totalHUF } = computeOrderTotals({
      lines,
      products: productMap,
      shippingMethod,
    });

    await assertPendingOrderRateLimit(userEmail);

    const orderNo = genOrderNo();
    const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
    const cancelUrl = `${base}/cart`;

    const order = await prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const product = await tx.product.findUnique({
          where: { id: line.productId },
          select: { stock: true },
        });
        if (!product || product.stock < line.quantity) {
          throw new Error("A kért mennyiség nem áll rendelkezésre raktáron.");
        }
      }

      const created = await tx.order.create({
        data: {
          userEmail,
          status: "PENDING",
          orderNo,
          totalHUF,
          subtotalHUF,
          shippingHUF,
          discountHUF,
          paymentMethod,
          shippingMethod,
          pickupPointId,
          shippingParcelId: "",
          billing,
          shipping: shippingAddr,
          note,
          items: {
            create: lines.map((line) => {
              const product = byId.get(line.productId);
              if (!product) throw new Error(`Missing product ${line.productId}`);
              return {
                productId: product.id,
                qty: line.quantity,
                priceHUF: Number(product.priceHUF),
              };
            }),
          },
        },
        include: { items: true },
      });

      if (isOfflinePayment) {
        for (const line of lines) {
          const updated = await tx.product.updateMany({
            where: { id: line.productId, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (updated.count !== 1) {
            throw new Error("A kért mennyiség nem áll rendelkezésre raktáron.");
          }
        }
      }

      return created;
    });

    if (isOfflinePayment) {
      // Offline payments must never reach Stripe Checkout below.
      // COD: create Foxpost parcel with cash-on-delivery.
      // Transfer: reserve stock + email only (parcel after payment confirmation).
      if (paymentMethod === "cod") {
        try {
          const parcelId = await createFoxpostParcelCOD({
            shippingMethod,
            pickupPointId,
            orderNo,
            totalHUF,
            email: userEmail,
            billing,
            shipping: shippingAddr,
            note,
          });
          if (parcelId) {
            await prisma.order.update({ where: { id: order.id }, data: { shippingParcelId: parcelId } });
          }
        } catch (codErr) {
          console.error("COD flow error:", codErr);
        }
      }

      const pickupPointInfo =
        shippingMethod === "foxpost_locker" && pickupPointId
          ? await resolveFoxpostPickup(pickupPointId)
          : null;

      const emailPayload: OrderEmailInput = {
        id: order.id,
        amount_total: totalHUF,
        amountScale: 1,
        currency: "HUF",
        customer_email: order.userEmail,
        customer_name: shippingAddr.name ?? billing.name ?? "",
        payment_status: paymentMethod,
        payment_label: paymentMethod === "transfer" ? "Átutalás" : "Utánvét",
        shippingMethod,
        billing,
        shipping: shippingAddr,
        note,
        pickupPoint: pickupPointInfo
          ? {
              carrier: "FOXPOST",
              id: pickupPointInfo.id,
              name: pickupPointInfo.name,
              address: pickupPointInfo.address,
            }
          : undefined,
        pickupPointLabel: pickupPointInfo
          ? `${pickupPointInfo.name} — ${pickupPointInfo.address}`
          : undefined,
        totals: { subtotal: subtotalHUF, shipping: shippingHUF, discount: discountHUF, total: totalHUF },
        line_items: order.items.map((li) => ({
          description: byId.get(li.productId)?.title ?? "Tétel",
          quantity: li.qty,
          amount_total: li.priceHUF * li.qty,
        })),
        orderNo,
      };

      try {
        const { sendOrderEmails } = await import("@/app/lib/email/send");
        await sendOrderEmails(emailPayload as never);
        await prisma.order.update({
          where: { id: order.id },
          data: { confirmationEmailSentAt: new Date() },
        });
      } catch (emailErr) {
        console.error(
          `[ORDER] Offline order email failed for ${orderNo}:`,
          emailErr instanceof Error ? emailErr.message : emailErr
        );
      }

      const offlineFlag = paymentMethod === "transfer" ? "transfer=1" : "cod=1";
      return NextResponse.json(
        {
          ...(paymentMethod === "transfer" ? { transfer: true } : { cod: true }),
          orderNo,
          redirect: `${base}/success?order_no=${encodeURIComponent(orderNo)}&${offlineFlag}`,
        },
        { status: 200 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-08-27.basil" });
    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    // This Stripe account stores HUF amounts as forints × 100 (e.g. 6000 Ft → 600000).
    // Default to 100 so price_data (shipping / products without stripePriceId) matches.
    let hufScale: 1 | 100 = 100;

    for (const line of lines) {
      const product = byId.get(line.productId);
      if (product?.stripePriceId?.startsWith("price_")) {
        try {
          const pr = await stripe.prices.retrieve(product.stripePriceId);
          if (pr?.currency === "huf" && typeof pr.unit_amount === "number") {
            const dbUnit = Number(product.priceHUF) || 0;
            if (dbUnit > 0) {
              const ratio = pr.unit_amount / dbUnit;
              if (Math.abs(ratio - 100) < 0.5) hufScale = 100;
              else if (Math.abs(ratio - 1) < 0.5) hufScale = 1;
            }
          }
          break;
        } catch {
          // Restricted keys may lack Prices Read — keep the ×100 default.
        }
      }
    }

    for (const line of lines) {
      const product = byId.get(line.productId);
      if (!product) continue;

      if (product.stripePriceId) {
        stripeLineItems.push({ price: product.stripePriceId, quantity: line.quantity });
      } else {
        stripeLineItems.push({
          quantity: line.quantity,
          price_data: {
            currency: "huf",
            unit_amount: Math.max(1, Math.round(Number(product.priceHUF) * hufScale)),
            product_data: {
              name: product.title || "Termék",
              metadata: { productId: String(product.id) },
            },
          },
        });
      }
    }

    if (shippingHUF > 0) {
      const shippingPriceId = resolveStripeShippingPriceId(shippingMethod);
      if (shippingPriceId) {
        stripeLineItems.push({ price: shippingPriceId, quantity: 1 });
      } else {
        stripeLineItems.push({
          quantity: 1,
          price_data: {
            currency: "huf",
            unit_amount: Math.max(1, Math.round(shippingHUF * hufScale)),
            product_data: { name: "Szállítás" },
          },
        });
      }
    }

    const baseMeta = {
      order_id: order.id,
      order_no: orderNo,
      shipping_method: shippingMethod,
      pickup_point_id: pickupPointId || "",
      payment_hint: paymentMethod,
      huf_scale: String(hufScale),
      note,
    };

    const successUrl = `${base}/success?session_id={CHECKOUT_SESSION_ID}&order_no=${encodeURIComponent(orderNo)}`;
    // Scope the key to this order: each checkout attempt creates a new order, so a
    // reused client Idempotency-Key must not collide across different Stripe payloads.
    const clientKey = sanitizeText(req.headers.get("Idempotency-Key"), 180);
    const idempotencyKey = clientKey
      ? `${clientKey}:${order.id}`
      : `checkout:${order.id}`;

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: stripeLineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: userEmail,
        client_reference_id: orderNo,
        allow_promotion_codes: false,
        metadata: baseMeta,
        payment_intent_data: { metadata: baseMeta },
      },
      { idempotencyKey }
    );

    if (!session?.url) {
      return NextResponse.json(
        { error: "Nem kaptunk vissza fizetési linket a szolgáltatótól." },
        { status: 502 }
      );
    }

    return NextResponse.json({ id: session.id, url: session.url }, { status: 200 });
  } catch (err) {
    const raw =
      err instanceof Error ? err.message : "Ismeretlen hiba a fizetési session létrehozásakor.";
    const message = /total amount due must add up to at least/i.test(raw)
      ? "A fizetendő összeg túl alacsony a kártyás fizetéshez. Próbáld meg szállítással, vagy válassz másik terméket."
      : /more_permissions_required|Permission denied/i.test(raw)
      ? "A Stripe kulcsnak nincs meg a szükséges jogosultsága (Checkout / Prices). Ellenőrizd a live secret keyt."
      : raw;
    const status = /raktáron|kosár|ÁSZF|Érvénytelen|Hiányos|csomagautomat|függőben|túl alacsony/i.test(
      message
    )
      ? 400
      : 500;
    console.error("create-checkout-session error:", message, err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Checkout API ready" });
}
