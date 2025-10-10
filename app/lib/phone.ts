export function normHuPhone(input?: string): string {
  const s = String(input ?? "").replace(/\D+/g, "");
  if (!s) return "";
  if (s.startsWith("36")) return `+${s}`;
  if (s.startsWith("06")) return `+36${s.slice(2)}`;
  if (s.startsWith("0")) return `+36${s.slice(1)}`;
  return s.startsWith("+") ? s : `+${s}`;
}
