import { prisma } from "@/app/lib/prisma";
import { sendOrderEmails } from "@/app/lib/email/send";
import { foxpostFetch } from "@/app/lib/foxpostClient";
import { resolveFoxpostPickup } from "@/app/lib/foxpostPickup";
import { normHuPhone } from "@/app/lib/phone";
import { resolveFoxpostFulfillmentMethod } from "@/app/lib/checkoutSecurity";
import {
  StockDecrementError,
  alertStockDecrementFailure,
} from "@/app/lib/opsAlerts";

type Address = {
  name?: string;
  email?: string;
  phone?: string;
  zip?: string | number;
  city?: string;
  address?: string;
};

function toHUF(v: unknown, def = 0): number {
  const n = Math.round(Number(v ?? def));
  return n > 0 ? n : 0;
}

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
}) {
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

  const fulfillmentMethod = resolveFoxpostFulfillmentMethod(shippingMethod);
  if (!fulfillmentMethod) {
    return null;
  }

  const recipientName = shipping?.name || billing?.name || "N/A";
  const recipientEmail = email || billing?.email || shipping?.email || "";
  const recipientPhone = normHuPhone(shipping?.phone || billing?.phone);
  const isCOD = String(paymentMethod || "").toLowerCase() === "cod";
  const cod = isCOD ? toHUF(totalHUF, 0) : 0;
  const refCode = orderNo || orderId;
  const size = "M";

  let item: Record<string, unknown>;

  if (fulfillmentMethod === "foxpost_locker") {
    if (!pickupPointId) throw new Error("Hiányzik a pickupPointId a Foxpost lockerhez.");
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
      throw new Error("Hiányos cím a Foxpost házhozszállításhoz.");
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

  try {
    const res = await foxpostFetch("/parcel", {
      method: "POST",
      body: JSON.stringify([item]),
    });

    const rawText = await res.text();
    if (res.status !== 201) {
      console.error(`Foxpost /parcel error: ${res.status} ${rawText?.slice(0, 800)}`);
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText || "[]");
    } catch (parseErr) {
      console.error("Foxpost /parcel parse failed:", parseErr);
      return null;
    }

    const first = Array.isArray(parsed)
      ? (parsed as Record<string, unknown>[])[0]
      : (parsed as Record<string, unknown>);
    const parcelId = ((first?.clFoxId as string | undefined) ||
      (first?.barcodeTof as string | undefined) ||
      null) as string | null;

    await prisma.order.update({
      where: { id: orderId },
      data: { shippingParcelId: parcelId || "" },
    });
    return { parcelId, raw: first };
  } catch (err) {
    console.error("Foxpost parcel creation failed:", err);
    return null;
  }
}

type OrderRecord = {
  id: string;
  totalHUF?: number | string | null;
  userEmail?: string | null;
  shippingMethod?: string | null;
  pickupPointId?: string | null;
  note?: string | null;
  subtotalHUF?: number | string | null;
  shippingHUF?: number | string | null;
  discountHUF?: number | string | null;
  orderNo?: string | null;
  billing?: Record<string, unknown> | null;
  shipping?: Record<string, unknown> | null;
  items?: Array<{
    productId?: string | null;
    qty?: number | string | null;
    priceHUF?: number | string | null;
    product?: { title?: string | null } | null;
  }>;
};

export async function sendOrderReceiptEmail(order: OrderRecord) {
  const billing = (order.billing || null) as Address | null;
  const shipping = (order.shipping || null) as Address | null;
  const pickupPointId = order.pickupPointId || null;

  const pickupPoint =
    order.shippingMethod === "foxpost_locker" && pickupPointId
      ? await resolveFoxpostPickup(pickupPointId)
      : null;

  const payload = {
    id: order.id,
    amount_total: Number(order.totalHUF || 0),
    amountScale: 1 as const,
    currency: "HUF",
    payment_status: "paid",
    payment_label: "Bankkártya (Stripe)",
    customer_email: order.userEmail || billing?.email || shipping?.email || "",
    customer_name: shipping?.name || billing?.name || "",
    shippingMethod: order.shippingMethod,
    pickupPoint: pickupPoint
      ? {
          carrier: "FOXPOST" as const,
          id: pickupPoint.id,
          name: pickupPoint.name,
          address: pickupPoint.address,
        }
      : pickupPointId
      ? { id: pickupPointId }
      : undefined,
    pickupPointLabel: pickupPoint
      ? `${pickupPoint.name} — ${pickupPoint.address}`
      : undefined,
    note: order.note,
    line_items: (order.items || []).map((item) => ({
      description: item.product?.title || item.productId || "Termék",
      quantity: Number(item.qty || 1),
      amount_total: Number(item.priceHUF || 0) * Number(item.qty || 1),
    })),
    totals: {
      subtotal: Number(order.subtotalHUF || 0),
      shipping: Number(order.shippingHUF || 0),
      discount: Number(order.discountHUF || 0),
      total: Number(order.totalHUF || 0),
    },
    orderNo: order.orderNo,
    billing,
    shipping,
  };

  await sendOrderEmails(payload as never);
}

export async function resolveOrderIdFromVerifiedStripeSession(args: {
  sessionId: string;
  retrieveStripeSession: (sessionId: string) => Promise<{
    metadata?: Record<string, string>;
    payment_status?: string | null;
    amount_total?: number | null;
  }>;
}): Promise<{ orderId: string | null; paymentVerified: boolean }> {
  const sessionId = String(args.sessionId || "").trim();
  if (!sessionId) {
    return { orderId: null, paymentVerified: false };
  }

  const session = await args.retrieveStripeSession(sessionId);
  const paymentVerified =
    session.payment_status === "paid" || session.payment_status === "no_payment_required";
  const orderId = String(session.metadata?.order_id || "").trim() || null;

  return { orderId, paymentVerified };
}

async function decrementStockForOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: { select: { title: true } } },
      },
    },
  });
  if (!order?.items.length) return;

  const failures: Array<{ productId: string; qty: number; title?: string }> = [];

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const updated = await tx.product.updateMany({
        where: {
          id: item.productId,
          stock: { gte: item.qty },
        },
        data: { stock: { decrement: item.qty } },
      });

      if (updated.count !== 1) {
        failures.push({
          productId: item.productId,
          qty: item.qty,
          title: item.product?.title,
        });
      }
    }
  });

  if (failures.length) {
    throw new StockDecrementError("Insufficient stock after payment capture", failures);
  }
}

export async function finalizeOrderAfterPayment(args: {
  orderId: string;
  shippingMethod?: string | null;
  paymentMethod?: string | null;
  pickupPointId?: string | null;
  note?: string | null;
  decrementStock?: boolean;
}) {
  const { orderId, shippingMethod, paymentMethod, pickupPointId, note, decrementStock = true } =
    args;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: { select: { title: true } } },
      },
    },
  });
  if (!order) return { ok: false, reason: "not_found" };

  const emailsAlreadySent = Boolean(order.confirmationEmailSentAt);
  if (order.status === "PAID" && emailsAlreadySent) {
    return { ok: true, order, alreadyCompleted: true };
  }

  const wasPending = order.status === "PENDING";
  let stockAlertSent = false;

  if (wasPending) {
    if (decrementStock) {
      try {
        await decrementStockForOrder(orderId);
      } catch (stockErr) {
        console.error("[ORDER] Stock decrement failed after payment:", stockErr);
        stockAlertSent = true;
        await alertStockDecrementFailure({
          orderId,
          orderNo: order.orderNo,
          userEmail: order.userEmail,
          paymentMethod: paymentMethod || order.paymentMethod,
          error: stockErr,
          failures:
            stockErr instanceof StockDecrementError
              ? stockErr.failures
              : order.items.map((item) => ({
                  productId: item.productId,
                  qty: item.qty,
                  title: item.product?.title,
                })),
        }).catch((alertErr) => {
          console.error("[OPS_ALERT] Failed to send stock decrement alert:", alertErr);
        });
      }
    }

    await prisma.order.update({ where: { id: orderId }, data: { status: "PAID" } });
  }

  const effectiveShippingMethod = shippingMethod || order.shippingMethod;
  const shouldCreateParcel =
    !order.shippingParcelId &&
    resolveFoxpostFulfillmentMethod(effectiveShippingMethod) !== null;

  if (shouldCreateParcel) {
    await createFoxpostParcelAfterPayment({
      orderId,
      orderNo: order.orderNo,
      shippingMethod: effectiveShippingMethod,
      paymentMethod: paymentMethod || order.paymentMethod,
      totalHUF: order.totalHUF,
      email: order.userEmail,
      billing: order.billing as Address,
      shipping: order.shipping as Address,
      pickupPointId: pickupPointId || order.pickupPointId,
      note: order.note || note,
    }).catch((err) => {
      console.error("[ORDER] Foxpost parcel creation error:", err);
    });
  }

  if (!emailsAlreadySent) {
    try {
      await sendOrderReceiptEmail(order as OrderRecord);
      await prisma.order.update({
        where: { id: orderId },
        data: { confirmationEmailSentAt: new Date() },
      });
    } catch (emailErr) {
      console.error("[ORDER] Order email send failed:", emailErr);
      return { ok: false, reason: "email_failed", order, stockAlertSent };
    }
  }

  const updated = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { select: { title: true } } } } },
  });
  return {
    ok: true,
    order: updated ?? { ...order, status: "PAID" },
    stockAlertSent,
  };
}
