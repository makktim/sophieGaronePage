import nodemailer from "nodemailer";

export function getSmtpCredentials() {
  const user =
    process.env.SMTP_USER ||
    process.env.GMAIL_USER ||
    process.env.NEXT_PUBLIC_GMAIL_USER ||
    "";
  // Gmail app passwords are often pasted with spaces ("xxxx xxxx xxxx xxxx").
  const pass = (
    process.env.SMTP_PASS ||
    process.env.GMAIL_PASS ||
    process.env.NEXT_PUBLIC_GMAIL_PASS ||
    ""
  ).replace(/\s+/g, "");
  return { user, pass };
}

export function hasSmtpCredentials() {
  const { user, pass } = getSmtpCredentials();
  return Boolean(user && pass);
}

export function createEmailTransport() {
  const { user, pass } = getSmtpCredentials();
  if (!user || !pass) {
    throw new Error(
      "Missing email credentials. Set GMAIL_USER/GMAIL_PASS or NEXT_PUBLIC_GMAIL_USER/NEXT_PUBLIC_GMAIL_PASS."
    );
  }

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user, pass },
    });
  }

  // Same transport style as the working contact form.
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}
