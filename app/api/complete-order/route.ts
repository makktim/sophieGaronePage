export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/app/lib/prisma";
import {
  finalizeOrderAfterPayment,
  resolveOrderIdFromVerifiedStripeSession,
} from "@/app/lib/orderCompletion";
import { sanitizeText, validateCheckoutOrigin } from "@/app/lib/checkoutSecurity";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" })
  : null;

export async function POST(req: NextRequest) {
  try {
    if (!validateCheckoutOrigin(req)) {
      return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 });
    }

    if (!stripe) {
      return NextResponse.json({ ok: false, error: "Stripe is not configured" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const sessionId = sanitizeText(body?.sessionId, 255);
    if (!sessionId || !sessionId.startsWith("cs_")) {
      return NextResponse.json(
        { ok: false, error: "Verified Stripe session is required" },
        { status: 400 }
      );
    }

    const { orderId: resolvedOrderId, paymentVerified } =
      await resolveOrderIdFromVerifiedStripeSession({
        sessionId,
        retrieveStripeSession: async (id) => {
          const session = await stripe.checkout.sessions.retrieve(id);
          return {
            metadata: (session.metadata ?? {}) as Record<string, string>,
            payment_status: session.payment_status,
            amount_total: session.amount_total,
          };
        },
      });

    if (!resolvedOrderId || !paymentVerified) {
      return NextResponse.json({ ok: false, error: "Payment not completed" }, { status: 402 });
    }

    const order = await prisma.order.findUnique({
      where: { id: resolvedOrderId },
      select: {
        id: true,
        paymentMethod: true,
        shippingMethod: true,
        pickupPointId: true,
        note: true,
        totalHUF: true,
      },
    });

    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    // Verified Stripe payment always finalizes (email + PAID), even if the order was
    // mistakenly tagged as transfer/cod in metadata — otherwise confirmation emails never send.
    const result = await finalizeOrderAfterPayment({
      orderId: resolvedOrderId,
      shippingMethod: order.shippingMethod,
      paymentMethod: "card",
      pickupPointId: order.pickupPointId,
      note: order.note,
      decrementStock: true,
    });

    if (result.ok && (order.paymentMethod === "cod" || order.paymentMethod === "transfer")) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentMethod: "card" },
      });
    }

    if (!result.ok && result.reason === "email_failed") {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[COMPLETE_ORDER] failed:", err);
    return NextResponse.json({ ok: false, error: "Failed to complete order" }, { status: 500 });
  }
}
