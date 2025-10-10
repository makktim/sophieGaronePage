export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/app/lib/prisma";
import { sendOrderEmails } from "@/app/lib/email/send";
import { foxpostFetch } from "@/app/lib/foxpostClient";
import type {
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
} from "@prisma/client";
import { OrderEmailInput } from "@/app/lib/email/templates/orderCustomer";
import { normHuPhone } from "@/app/lib/phone";
import { resolveFoxpostPickup } from "@/app/lib/foxpostPickup";

// --- Stripe init ---
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Szállítási módok
const SHIPPING_METHODS = {
  FOXPOST_LOCKER: "foxpost_locker",
  FOXPOST_HOME: "foxpost_home",
  GLS_COURIER: "gls_courier",
  COURIER: "courier",
} as const;

// ===== Helpers, típusok =====
type Address = {
  name?: string;
  email?: string;
  phone?: string;
  zip?: string | number;
  city?: string;
  address?: string;
};

type OrderWithItems = PrismaOrder & { items: PrismaOrderItem[] };

type EmailLineItem = {
  description: string;
  quantity: number | null;
  amount_total: number | null;
};

function toHUF(v: unknown, def = 0): number {
  const n = Math.round(Number(v ?? def));
  return n > 0 ? n : 0;
}

function liDesc(li: Stripe.LineItem): string {
  return (
    li.description ||
    li.price?.nickname ||
    (li.price?.product as string | undefined) ||
    "Tétel"
  );
}

function asAddress(json: unknown): Address | null {
  if (!json || typeof json !== "object") return null;
  return json as Address;
}

// FoxWeb /parcel hívás kártyás teljesítés után (locker + home)
async function createFoxpostParcelAfterPayment(args: {
  orderId: string;
  orderNo?: string | null;
  shippingMethod?: string | null;
  paymentMethod?: string | null;
  totalHUF?: number | null;
  email?: string | null;
  billing?: Address | null;
  shipping?: Address | null;
  pickupPointId?: string | null;
  note?: string | null;
}): Promise<{ parcelId: string | null; raw: unknown } | null> {
  const {
    orderId,
    orderNo,
    shippingMethod,
    paymentMethod,
    totalHUF,
    email,
    billing,
    shipping,
    pickupPointId,
    note,
  } = args;

  if (
    shippingMethod !== SHIPPING_METHODS.FOXPOST_LOCKER &&
    shippingMethod !== SHIPPING_METHODS.FOXPOST_HOME
  ) {
    return null;
  }

  const recipientName = shipping?.name || billing?.name || "N/A";
  const recipientEmail = email || billing?.email || shipping?.email || "";
  const recipientPhone = normHuPhone(shipping?.phone || billing?.phone);

  const isCOD = String(paymentMethod || "").toLowerCase() === "cod";
  const cod = isCOD ? toHUF(totalHUF, 0) : 0;
  const size = "M";
  const refCode = orderNo || orderId;

  type LockerItem = {
    recipientName: string;
    recipientEmail: string;
    recipientPhone: string;
    destination: string;
    size: "XS" | "S" | "M" | "L" | "XL";
    refCode: string;
    cod?: number;
    comment?: string;
  };
  type HomeItem = {
    recipientName: string;
    recipientEmail: string;
    recipientPhone: string;
    recipientZip: string;
    recipientCity: string;
    recipientAddress: string;
    recipientCountry: "HU";
    size: "XS" | "S" | "M" | "L" | "XL";
    refCode: string;
    cod?: number;
    comment?: string;
  };

  let item: LockerItem | HomeItem;

  if (shippingMethod === SHIPPING_METHODS.FOXPOST_LOCKER) {
    if (!pickupPointId)
      throw new Error(
        "Hiányzik a pickupPointId a Foxpost locker szállításhoz."
      );
    item = {
      recipientName,
      recipientEmail,
      recipientPhone,
      destination: pickupPointId,
      size,
      refCode,
      ...(cod > 0 ? { cod } : {}),
      ...(note ? { comment: String(note).slice(0, 50) } : {}),
    };
  } else {
    const addr = shipping || billing || {};
    if (!addr?.zip || !addr?.city || !addr?.address) {
      throw new Error("Hiányos szállítási cím a Foxpost házhozszállításhoz.");
    }
    item = {
      recipientName,
      recipientEmail,
      recipientPhone,
      recipientZip: String(addr.zip),
      recipientCity: addr.city!,
      recipientAddress: addr.address!,
      recipientCountry: "HU",
      size,
      refCode,
      ...(cod > 0 ? { cod } : {}),
      ...(note ? { comment: String(note).slice(0, 50) } : {}),
    };
  }

  const res = await foxpostFetch(`/parcel`, {
    method: "POST",
    body: JSON.stringify([item]),
  });

  const rawText = await res.text();
  if (res.status !== 201) {
    throw new Error(`Foxpost /parcel ${res.status} ${rawText?.slice(0, 800)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText || "[]");
  } catch {
    parsed = [];
  }
  const first = Array.isArray(parsed)
    ? (parsed as Record<string, unknown>[])[0]
    : (parsed as Record<string, unknown>);
  const clFoxId = (first?.clFoxId as string | undefined) ?? null;
  const barcodeTof = (first?.barcodeTof as string | undefined) ?? null;
  const parcelId = clFoxId || barcodeTof || null;

  await prisma.order.update({
    where: { id: orderId },
    data: { shippingParcelId: parcelId || "" },
  });

  return { parcelId, raw: first };
}

// ===== Webhook handler =====
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig)
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const e = err as Error;
    console.error("[WEBHOOK] Stripe signature error:", e.message);
    return NextResponse.json(
      { error: "Signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // 1) Order meta
        const md = (session.metadata ?? {}) as Record<string, string>;
        const orderId = md.order_id || "";
        const shippingMethod = md.shipping_method || "";
        const paymentHint = (md.payment_hint || "").toLowerCase();
        const pickupPointId = md.pickup_point_id || null;

        // 2) Order státusz: PAID
        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: "PAID" },
          });
        }

        // 3) Order beolvasás (e-mailhez, Foxposthoz)
        const orderDb: OrderWithItems | null = orderId
          ? await prisma.order.findUnique({
              where: { id: orderId },
              include: { items: true },
            })
          : null;

        // 4) Készlet csökkentés
        if (orderDb?.items?.length) {
          await prisma.$transaction(
            orderDb.items.map((it) =>
              prisma.product.update({
                where: { id: it.productId },
                data: { stock: { decrement: it.qty } },
              })
            )
          );
        }

        // 5) Stripe line items
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id
        );

        const pickupPointInfo =
          shippingMethod === "foxpost_locker" && pickupPointId
            ? await resolveFoxpostPickup(pickupPointId)
            : null;

        // 6) Foxpost csomag (locker + home)
        try {
          if (
            shippingMethod === SHIPPING_METHODS.FOXPOST_LOCKER ||
            shippingMethod === SHIPPING_METHODS.FOXPOST_HOME
          ) {
            await createFoxpostParcelAfterPayment({
              orderId: orderId || session.id,
              orderNo:
                orderDb?.orderNo || session.client_reference_id || session.id,
              shippingMethod,
              paymentMethod: orderDb?.paymentMethod || paymentHint,
              totalHUF: orderDb?.totalHUF ?? session.amount_total ?? 0,
              email:
                orderDb?.userEmail ||
                session.customer_details?.email ||
                session.customer_email ||
                "",
              billing: asAddress(orderDb?.billing),
              shipping: asAddress(orderDb?.shipping),
              pickupPointId: orderDb?.pickupPointId || pickupPointId,
              note: orderDb?.note ?? null,
            });
          }
        } catch (foxErr) {
          const e = foxErr as Error;
          console.error("[WEBHOOK] Foxpost create parcel error:", e.message);
        }

        // 7) E-mail payload (kártyás)
        const emailPayload: OrderEmailInput = {
          id: session.id,
          order_no:
            orderDb?.orderNo || session.client_reference_id || undefined,
          amount_total: session.amount_total ?? 0,
          currency: (session.currency || "HUF").toUpperCase(),
          customer_email:
            orderDb?.userEmail ||
            session.customer_details?.email ||
            session.customer_email ||
            "",
          customer_name:
            session.customer_details?.name ||
            (asAddress(orderDb?.billing)?.name ?? ""),
          payment_status: session.payment_status, // "paid"
          billing: asAddress(orderDb?.billing),
          shipping: asAddress(orderDb?.shipping),
          shippingMethod,
          pickupPointId: orderDb?.pickupPointId || pickupPointId,
          pickupPoint: pickupPointInfo || undefined,
          note: orderDb?.note ?? null,
          totals: {
            subtotal: orderDb?.subtotalHUF ?? undefined,
            shipping: orderDb?.shippingHUF ?? undefined,
            discount: orderDb?.discountHUF ?? undefined,
            total: orderDb?.totalHUF ?? session.amount_total ?? undefined,
          },
          line_items: lineItems.data.map<EmailLineItem>((li) => ({
            description: liDesc(li),
            quantity: li.quantity,
            amount_total: li.amount_total,
          })),
        };

        await sendOrderEmails(emailPayload);
        break;
      }

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: "FAILED" },
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = (
          pi.metadata as unknown as Record<string, string> | null
        )?.order_id;
        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: "FAILED" },
          });
        }
        break;
      }

      default:
        // más Stripe eventek most nem érdekesek
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const e = err as Error;
    console.error("[WEBHOOK] handler error:", e);
    return NextResponse.json(
      { error: e.message || "handler error" },
      { status: 500 }
    );
  }
}
