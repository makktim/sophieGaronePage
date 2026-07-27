// app/lib/email/providers/resend.ts
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY!;
const resend = new Resend(apiKey);

export async function sendEmailResend({
  to,
  from,
  subject,
  html,
  text,
}: {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const r = await resend.emails.send({ to, from, subject, html, text });
  if (r.error) throw new Error(String(r.error?.message || "Resend error"));
  return r;
}
