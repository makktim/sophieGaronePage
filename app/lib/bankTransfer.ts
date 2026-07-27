/**
 * Public bank-transfer instructions for customers.
 * Prefer NEXT_PUBLIC_* so the success page (client) can show them too.
 */
export type BankTransferDetails = {
  beneficiary: string;
  accountNumber: string;
  bankName: string;
};

export function getBankTransferDetails(): BankTransferDetails | null {
  const beneficiary = (
    process.env.NEXT_PUBLIC_BANK_TRANSFER_BENEFICIARY ||
    process.env.BANK_TRANSFER_BENEFICIARY ||
    "Makkai-Kása Tímea Zsófia EV"
  ).trim();

  const accountNumber = (
    process.env.NEXT_PUBLIC_BANK_TRANSFER_ACCOUNT ||
    process.env.BANK_TRANSFER_ACCOUNT ||
    ""
  ).trim();

  const bankName = (
    process.env.NEXT_PUBLIC_BANK_TRANSFER_BANK ||
    process.env.BANK_TRANSFER_BANK ||
    ""
  ).trim();

  if (!accountNumber) return null;

  return { beneficiary, accountNumber, bankName };
}

export function isTransferPayment(order: {
  payment_status?: string | null;
  payment_label?: string | null;
}): boolean {
  const status = String(order.payment_status || "").toLowerCase();
  const label = String(order.payment_label || "").toLowerCase();
  return (
    status === "transfer" ||
    status === "bank_transfer" ||
    label.includes("átutal")
  );
}

export function formatBankTransferInstructions(
  orderNo: string,
  details: BankTransferDetails
): { textLines: string[]; htmlBlock: string } {
  const ref = String(orderNo || "").trim() || "RENDELÉSSZÁM";
  const textLines = [
    "Átutalási adatok:",
    `Kedvezményezett: ${details.beneficiary}`,
    `Számlaszám: ${details.accountNumber}`,
    details.bankName ? `Bank: ${details.bankName}` : "",
    `Közlemény: ${ref}`,
    "Kérjük, a közleményben pontosan a rendelésszámot add meg.",
  ].filter(Boolean);

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const rows = [
    ["Kedvezményezett", details.beneficiary],
    ["Számlaszám", details.accountNumber],
    details.bankName ? ["Bank", details.bankName] : null,
    ["Közlemény", ref],
  ].filter(Boolean) as [string, string][];

  const htmlBlock = `
    <div style="margin-top:14px;padding:14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;">
      <div style="font-weight:700;margin-bottom:8px;color:#166534;">Fizetés átutalással</div>
      <div style="font-size:14px;color:#14532d;line-height:1.5;">
        ${rows
          .map(
            ([label, value]) =>
              `<div style="margin:0 0 6px"><span style="color:#166534">${esc(
                label
              )}:</span> <strong style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace">${esc(
                value
              )}</strong></div>`
          )
          .join("")}
        <div style="margin-top:8px;font-size:13px;color:#166534">
          Kérjük, a közleményben pontosan a rendelésszámot add meg, hogy be tudjuk azonosítani a befizetést.
        </div>
      </div>
    </div>
  `;

  return { textLines, htmlBlock };
}
