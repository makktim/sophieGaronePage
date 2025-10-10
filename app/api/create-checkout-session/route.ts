// app/api/create-checkout-session/route.ts
export const runtime = "nodejs";
import type { Product } from "@prisma/client";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/app/lib/prisma";
import { foxpostFetch } from "@/app/lib/foxpostClient";
import { sendOrderEmails } from "@/app/lib/email/send";
import { OrderEmailInput } from "@/app/lib/email/templates/orderCustomer";
import { resolveFoxpostPickup } from "@/app/lib/foxpostPickup";

// ===== Types =====

type Address = {
  name?: string;
  email?: string;
  phone?: string;
  zip?: string | number;
  city?: string;
  address?: string;
};

type CartItem = {
  id: string;
  name?: string;
  quantity: number;
};

type BodyShape = {
  items: CartItem[];
  customer?: {
    email?: string;
    phone?: string;
    billing?: Address;
    shippingAddress?: Address;
  };
  shippingMethod?:
    | "foxpost_locker"
    | "foxpost_home"
    | "gls_courier"
    | "courier"
    | string;
  pickupPoint?: { id?: string } | null;
  shippingCost?: number;
  subtotal?: number;
  discount?: number;
  total?: number;
  totals?: {
    subtotal?: number;
    shipping?: number;
    discount?: number;
    total?: number;
  };
  note?: string;
  coupon?: string;
  paymentHint?: "card" | "cod" | string;
};

type FoxpostParcelResponseItem = {
  clFoxId?: string; // locker esetén
  barcodeTof?: string; // házhoz esetén
  sendType?: "APM" | "HD" | "COLLECT";
  errors?: unknown;
};

// ===== Stripe init =====

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

// ===== Helpers =====

const clip = (obj: unknown, max = 480): string => {
  try {
    const s = typeof obj === "string" ? obj : JSON.stringify(obj ?? {});
    return s.length > max ? `${s.slice(0, max)}…` : s;
  } catch {
    return String(obj ?? "");
  }
};

function genOrderNo(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rnd = Math.floor(Math.random() * 900000 + 100000);
  return `ORD-${y}${m}${day}-${rnd}`;
}

// +36-os normalizáló (Foxpost elvárás)
function normHuPhone(input?: string): string {
  const s = String(input ?? "").replace(/\D+/g, "");
  if (!s) return "";
  if (s.startsWith("36")) return `+${s}`;
  if (s.startsWith("06")) return `+36${s.slice(2)}`;
  if (s.startsWith("0")) return `+36${s.slice(1)}`;
  return s.startsWith("+") ? s : `+${s}`;
}

function toHUF(v: unknown, def = 0): number {
  const n = Math.round(Number(v ?? def));
  return n > 0 ? n : 0;
}

function isSandboxFoxpost(): boolean {
  return (process.env.FOXPOST_BASE_URL || "").includes("webapi-test");
}

// FoxWeb /parcel hívás COD rendeléshez (locker vagy home)
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
  const {
    shippingMethod,
    pickupPointId,
    orderNo,
    totalHUF,
    email,
    billing,
    shipping,
    note,
  } = params;

  const size = "M"; // kötelező – végső méretet Foxpost állapítja meg
  const recipientName = shipping.name || billing.name || "N/A";
  const recipientEmail = email || billing.email || shipping.email || "";
  const recipientPhone = normHuPhone(shipping.phone || billing.phone);

  let item:
    | {
        // locker
        recipientName: string;
        recipientEmail: string;
        recipientPhone: string;
        destination: string;
        size: string;
        refCode: string;
        cod: number;
        comment?: string;
      }
    | {
        // home
        recipientName: string;
        recipientEmail: string;
        recipientPhone: string;
        recipientZip: string;
        recipientCity: string;
        recipientAddress: string;
        recipientCountry: "HU";
        size: string;
        refCode: string;
        cod: number;
        comment?: string;
      };

  if (shippingMethod === "foxpost_locker") {
    if (!pickupPointId) throw new Error("Hiányzik a pickupPointId lockerhez.");
    item = {
      recipientName,
      recipientEmail,
      recipientPhone,
      destination: pickupPointId, // operator_id
      size,
      refCode: orderNo,
      cod: toHUF(totalHUF),
      ...(note ? { comment: String(note).slice(0, 50) } : {}),
    };
  } else if (shippingMethod === "foxpost_home") {
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
      cod: toHUF(totalHUF),
      ...(note ? { comment: String(note).slice(0, 50) } : {}),
    };
  } else {
    // Nem Foxpost szállítás – nem hozunk létre csomagot
    return null;
  }

  const query = isSandboxFoxpost() ? "?isWeb=false" : "";
  const res = await foxpostFetch(`/parcel${query}`, {
    method: "POST",
    body: JSON.stringify([item]), // TÖMB kell!
  });

  const raw = await res.text();

  if (res.status !== 201) {
    // 200 esetén is lehet hiba (valid=false + errors) – ezt is lássuk logban
    console.error("Foxpost /parcel error:", res.status, raw);
    return null;
  }

  let arr: unknown;
  try {
    arr = JSON.parse(raw || "[]");
  } catch {
    return null;
  }
  const first = Array.isArray(arr)
    ? (arr[0] as FoxpostParcelResponseItem)
    : (arr as FoxpostParcelResponseItem);
  const clFoxId = first?.clFoxId;
  const barcodeTof = first?.barcodeTof;

  return clFoxId || barcodeTof || null;
}

// ===== Route =====

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Hiányzik a STRIPE_SECRET_KEY." },
        { status: 500 }
      );
    }

    const body: BodyShape = await req.json();
    const cartItems = Array.isArray(body.items) ? body.items : [];
    if (!cartItems.length) {
      return NextResponse.json({ error: "A kosár üres." }, { status: 400 });
    }

    // 1) Termékek validálása DB-vel (árak innen jönnek)
    const productIds = cartItems.map((it) => String(it.id));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        title: true,
        priceHUF: true,
        stock: true,
        stripePriceId: true,
      },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    const missing = productIds.filter((id) => !byId.has(id));
    if (missing.length) {
      return NextResponse.json(
        {
          error: "Ismeretlen termék(ek) a kosárban.",
          missingProductIds: missing,
        },
        { status: 400 }
      );
    }

    // 2) Összegek (HUF, egész)
    const computedSubtotal = cartItems.reduce((sum, it) => {
      const p = byId.get(String(it.id))!;
      return sum + Number(p.priceHUF) * Math.max(1, Number(it.quantity || 1));
    }, 0);

    const subtotalHUF = toHUF(
      body.totals?.subtotal ?? body.subtotal ?? computedSubtotal
    );
    const shippingHUF = toHUF(body.totals?.shipping ?? body.shippingCost ?? 0);
    const discountHUF = toHUF(body.totals?.discount ?? body.discount ?? 0);
    const totalHUF = toHUF(
      body.totals?.total ??
        body.total ??
        subtotalHUF + shippingHUF - discountHUF
    );

    // 3) Szállítás/fizetés
    const paymentMethod = String(body.paymentHint ?? "card").toLowerCase(); // "card" | "cod"
    const shippingMethod = String(body.shippingMethod ?? "foxpost_locker");
    const pickupPointId = String(body.pickupPoint?.id ?? "");

    // 4) Címek
    const billing: Address = body.customer?.billing ?? {};
    const shippingAddr: Address =
      body.customer?.shippingAddress ?? body.customer?.billing ?? {};
    const userEmail = body.customer?.email ?? "unknown@example.com";

    // 5) OrderNo + URL-ek
    const orderNo = genOrderNo();
    const base = (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000"
    ).replace(/\/$/, "");
    const successUrl = `${base}/success?session_id={CHECKOUT_SESSION_ID}&order_no=${orderNo}`;
    const cancelUrl = `${base}/cart`;

    // 6) Order mentése PENDING-ként (minden kötelező mező)
    const order = await prisma.order.create({
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
        shippingParcelId: "", // később kerül be a Foxpost azonosító
        billing,
        shipping: shippingAddr,
        note: String(body.note ?? ""),
        items: {
          create: cartItems.map((it) => {
            const p = byId.get(String(it.id))!;
            return {
              productId: p.id,
              qty: Math.max(1, Number(it.quantity || 1)),
              priceHUF: Number(p.priceHUF),
            };
          }),
        },
      },
      include: { items: true },
    });

    // 7) COD (utánvét) ág — NINCS Stripe, Foxpost csomag azonnal
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
          note: String(body.note ?? ""),
        });

        if (parcelId) {
          await prisma.order.update({
            where: { id: order.id },
            data: { shippingParcelId: parcelId },
          });
        } else {
          // nem törjük el a folyamatot – a rendelés létrejött
          console.error(
            "Foxpost COD create returned null (parcel not created)."
          );
        }

        // készlet csökkentése
        if (order.items.length) {
          await prisma.$transaction(
            order.items.map((it) =>
              prisma.product.update({
                where: { id: it.productId },
                data: { stock: { decrement: it.qty } },
              })
            )
          );
        }
      } catch (codErr) {
        console.error("COD flow error:", (codErr as Error).message);
      }

      const pickupPointInfo =
        shippingMethod === "foxpost_locker" && pickupPointId
          ? await resolveFoxpostPickup(pickupPointId)
          : null;

      const emailPayload: OrderEmailInput = {
        id: order.id,
        order_no: order.orderNo,
        amount_total: totalHUF,
        currency: "HUF",
        customer_email: order.userEmail,
        customer_name:
          (order.shipping as any)?.name ?? (order.billing as any)?.name ?? "",
        payment_status: "cod",
        payment_label: "Utánvét",
        billing: order.billing as any,
        shipping: order.shipping as any,
        pickupPoint: pickupPointInfo || undefined, // ← EZ KELL A LEVÉLBE
        note: (order.note ?? null) as any,
        totals: {
          subtotal: subtotalHUF,
          shipping: shippingHUF,
          discount: discountHUF,
          total: totalHUF,
        },
        line_items: order.items.map((li) => ({
          description: byId.get(li.productId)?.title ?? "Tétel",
          quantity: li.qty,
          amount_total: li.priceHUF * li.qty,
        })),
      };

      await sendOrderEmails(emailPayload);

      return NextResponse.json(
        { cod: true, orderNo, redirect: `${base}/success?order_no=${orderNo}` },
        { status: 200 }
      );
    }

    // --- 8) Kártyás (Stripe) ág — Price ID preferált, fallback price_data ---

    // opcionális: szállítási árakhoz külön Price ID-k (ENV-ből)
    // Ha változó szállítási díjad van, hagyd üresen ezeket, és marad a dinamikus price_data.
    const SHIPPING_PRICE_IDS: Record<string, string | undefined> = {
      foxpost_locker: process.env.STRIPE_PRICE_SHIPPING_FOXPOST_LOCKER,
      foxpost_home: process.env.STRIPE_PRICE_SHIPPING_FOXPOST_HOME,
      gls_courier: process.env.STRIPE_PRICE_SHIPPING_GLS,
      courier: process.env.STRIPE_PRICE_SHIPPING_COURIER,
    };
    const FALLBACK_SHIPPING_PRICE_ID = process.env.STRIPE_PRICE_SHIPPING_ID;

    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // ── Skála detektálása a HUF-hoz (1 vagy 100) a meglévő Stripe Price alapján ──
    let hufScale = 1;
    for (const it of cartItems) {
      const p = byId.get(String(it.id));
      if (p?.stripePriceId?.startsWith("price_")) {
        try {
          const pr = await stripe.prices.retrieve(p.stripePriceId);
          if (pr?.currency === "huf" && typeof pr.unit_amount === "number") {
            const dbUnit = Number(p.priceHUF) || 0;
            if (dbUnit > 0) {
              const ratio = pr.unit_amount / dbUnit; // pl. 629000 / 6290 = 100
              if (Math.abs(ratio - 100) < 0.5) hufScale = 100;
            }
          }
          break; // elég egy mintából megállapítani
        } catch {}
      }
    }

    // Terméktételek
    for (const it of cartItems) {
      const p = byId.get(String(it.id)) as
        | (Product & { stripePriceId: string | null })
        | undefined;
      if (!p) continue;

      const quantity = Math.max(1, Number(it.quantity || 1));

      if (p.stripePriceId) {
        // Előre létrehozott Stripe Price ID használata
        stripeLineItems.push({
          price: p.stripePriceId,
          quantity,
        });
      } else {
        // Fallback: dinamikus price_data a DB-ből
        stripeLineItems.push({
          quantity,
          price_data: {
            currency: "huf",
            unit_amount: Math.max(1, Math.round(Number(p.priceHUF) * hufScale)),
            product_data: {
              name: it.name || p.title || "Termék",
              metadata: { productId: String(p.id) },
            },
          },
        });
      }
    }

    // Szállítás
    if (shippingHUF > 0) {
      const shippingPriceId =
        SHIPPING_PRICE_IDS[shippingMethod] || FALLBACK_SHIPPING_PRICE_ID;

      if (shippingPriceId) {
        // Fix összegű, Stripe-on előre létrehozott szállítási Price
        // (figyelj, hogy a Stripe Price összege egyezzen a nálad számolt shippingHUF-fal)
        stripeLineItems.push({
          price: shippingPriceId,
          quantity: 1,
        });
      } else {
        // Dinamikus szállítási költség
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
      huf_scale: String(hufScale), // 1 vagy 100 – később jól jön
      billing_json: clip(billing),
      shipping_json: clip(shippingAddr),
      totals_json: clip({
        subtotal: subtotalHUF,
        shipping: shippingHUF,
        discount: discountHUF,
        total: totalHUF,
      }),
      note: String(body.note ?? ""),
      items_json: clip(
        order.items.map((li) => ({
          productId: li.productId,
          qty: li.qty,
          unit: li.priceHUF,
        }))
      ),
    } satisfies Record<string, string>;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: stripeLineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userEmail || undefined,
      client_reference_id: orderNo,
      allow_promotion_codes: true,
      metadata: baseMeta,
      payment_intent_data: { metadata: baseMeta },
    });

    if (!session?.url) {
      return NextResponse.json(
        { error: "Nem kaptunk vissza fizetési linket a szolgáltatótól." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { id: session.id, url: session.url },
      { status: 200 }
    );
  } catch (err) {
    const e = err as {
      raw?: { message?: string; code?: string };
      message?: string;
      code?: string;
    };
    const msg =
      e?.raw?.message ||
      e?.message ||
      "Ismeretlen hiba a fizetési session létrehozásakor.";
    const code = e?.raw?.code || e?.code;
    console.error("create-checkout-session error:", code || "", msg, err);
    return NextResponse.json(
      { error: msg, code: code || undefined },
      { status: 500 }
    );
  }
}
