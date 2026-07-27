export function paymentHuLabel(opts: {
  paymentMethod?: string | null; // pl. 'cod' | 'transfer' | 'card'
  paymentStatus?: string | null; // pl. 'paid'
}): string {
  const m = (opts.paymentMethod || "").toLowerCase();
  const s = (opts.paymentStatus || "").toLowerCase();

  if (m === "transfer" || m === "bank_transfer" || s === "transfer") {
    return "Átutalás";
  }
  if (m === "cod") return "Utánvét";
  if (s === "cod") return "Utánvét";
  if (s === "paid" || m === "card") return "Bankkártya (Stripe)";
  if (s === "unpaid" || s === "requires_payment_method") return "Fizetésre vár";
  return "Folyamatban";
}
