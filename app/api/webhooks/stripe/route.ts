export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/app/lib/prisma";
import { finalizeOrderAfterPayment } from "@/app/lib/orderCompletion";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" })
  : null;

function isPaidSession(session: Stripe.Checkout.Session): boolean {
  return session.payment_status === "paid" || session.payment_status === "no_payment_required";
}

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[WEBHOOK] Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[WEBHOOK] Stripe signature error:", err);
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!isPaidSession(session)) {
          break;
        }

        const md = (session.metadata ?? {}) as Record<string, string>;
        const orderId = md.order_id || "";
        if (!orderId) break;

        // Stripe Checkout always means card payment for fulfillment/email labeling.
        // Ignore transfer/cod hints in metadata (those are offline-only flows).
        await finalizeOrderAfterPayment({
          orderId,
          shippingMethod: md.shipping_method || null,
          paymentMethod: "card",
          pickupPointId: md.pickup_point_id || null,
          note: md.note || null,
          decrementStock: true,
        });
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const md = (session.metadata ?? {}) as Record<string, string>;
        if (md.order_id) {
          await prisma.order.updateMany({
            where: { id: md.order_id, status: "PENDING" },
            data: { status: "FAILED" },
          });
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[WEBHOOK] handler error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Webhook ready" });
}
