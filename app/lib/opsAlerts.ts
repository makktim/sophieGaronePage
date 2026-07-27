import { sendOpsAlertEmail } from "@/app/lib/email/send";

export class StockDecrementError extends Error {
  readonly failures: Array<{ productId: string; qty: number; title?: string }>;

  constructor(
    message: string,
    failures: Array<{ productId: string; qty: number; title?: string }>
  ) {
    super(message);
    this.name = "StockDecrementError";
    this.failures = failures;
  }
}

export type StockDecrementFailureAlert = {
  orderId: string;
  orderNo: string | null;
  userEmail: string;
  paymentMethod: string;
  error: unknown;
  failures: Array<{ productId: string; qty: number; title?: string }>;
};

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? "Unknown error");
}

export async function alertStockDecrementFailure(
  alert: StockDecrementFailureAlert
): Promise<void> {
  const payload = {
    type: "STOCK_DECREMENT_FAILED",
    severity: "critical",
    orderId: alert.orderId,
    orderNo: alert.orderNo,
    userEmail: alert.userEmail,
    paymentMethod: alert.paymentMethod,
    message: formatError(alert.error),
    failures: alert.failures,
    timestamp: new Date().toISOString(),
  };

  console.error("[OPS_ALERT] STOCK_DECREMENT_FAILED", JSON.stringify(payload));

  await sendOpsAlertEmail({
    subject: `[URGENT] Készletcsökkentés sikertelen — ${alert.orderNo || alert.orderId}`,
    headline: "Készletcsökkentés sikertelen fizetés után",
    bodyLines: [
      `A rendelés státusza PAID, de a készlet automatikus csökkentése nem sikerült.`,
      `Rendelés: ${alert.orderNo || "—"} (${alert.orderId})`,
      `Vásárló: ${alert.userEmail}`,
      `Fizetés: ${alert.paymentMethod}`,
      `Hiba: ${formatError(alert.error)}`,
      "",
      "Érintett tételek:",
      ...alert.failures.map(
        (item) =>
          `- ${item.title || item.productId}: ${item.qty} db (productId: ${item.productId})`
      ),
      "",
      "Teendő: ellenőrizd a készletet és teljesítsd manuálisan a rendelést.",
    ],
  });
}
