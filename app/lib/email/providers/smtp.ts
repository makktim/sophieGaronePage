import { createEmailTransport } from "../transport";
import crypto from "crypto";

export async function sendEmailSmtp({
  to,
  from,
  subject,
  html,
  text,
  extraHeaders,
}: {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
  extraHeaders?: Record<string, string>;
}) {
  const transporter = createEmailTransport();
  const info = await transporter.sendMail({
    to,
    from,
    replyTo: from,
    subject,
    html,
    text,
    headers: {
      'Precedence': 'transactional',
      'X-Entity-Ref-ID': `sophiegarone-${crypto.randomUUID()}`,
      ...extraHeaders,
    },
  });
  return info;
}
