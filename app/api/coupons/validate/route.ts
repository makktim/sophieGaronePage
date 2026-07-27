import { NextResponse } from "next/server";
import Stripe from "stripe";

function envCouponCodes(): Set<string> {
  const raw = process.env.COUPON_CODES || "";
  return new Set(
    raw
      .split(/[,\n;]/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body?.code ?? "").trim();

    if (!code) {
      return NextResponse.json(
        { valid: false, message: "Érvénytelen kód" },
        { status: 200 }
      );
    }

    const normalized = code.toUpperCase();

    // Local/dev allow-list: COUPON_CODES=TESZT10,SOPHIE10
    if (envCouponCodes().has(normalized)) {
      return NextResponse.json({
        valid: true,
        message: "A kód hozzáadva",
        code: normalized,
      });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        valid: false,
        message: "Érvénytelen kód",
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    });

    const promos = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
    });

    if (promos.data.length > 0) {
      return NextResponse.json({
        valid: true,
        message: "A kód hozzáadva",
        code: promos.data[0].code,
        promotionCodeId: promos.data[0].id,
      });
    }

    return NextResponse.json({
      valid: false,
      message: "Érvénytelen kód",
    });
  } catch (err) {
    console.error("validate-coupon error:", err);
    return NextResponse.json(
      { valid: false, message: "Érvénytelen kód" },
      { status: 200 }
    );
  }
}
