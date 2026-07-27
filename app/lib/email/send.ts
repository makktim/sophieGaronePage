import { sendEmailResend } from "./providers/resend";
import { sendEmailSmtp } from "./providers/smtp";
import { getSmtpCredentials, hasSmtpCredentials } from "./transport";
import {
  renderCustomerEmail,
  type OrderEmailInput,
  type Brand,
} from "./templates/orderCustomer";
import { renderMerchantEmail } from "./templates/orderMerchant";

function resolveEmailProvider() {
  const explicit = (process.env.EMAIL_PROVIDER || "").toLowerCase();
  if (explicit === "smtp") return "smtp";
  if (explicit === "resend") return "resend";

  const hasResendKey = Boolean(process.env.RESEND_API_KEY);

  if (hasSmtpCredentials()) return "smtp";
  if (hasResendKey) return "resend";
  return "resend";
}

function resolveEmailFrom() {
  const provider = resolveEmailProvider();
  const explicitEmailFrom = (process.env.EMAIL_FROM || "").trim();
  const isPlaceholderResendFrom =
    explicitEmailFrom.includes("onboarding@resend.dev") ||
    explicitEmailFrom.includes("resend.dev");

  if (provider === "smtp") {
    const gmailUser = process.env.NEXT_PUBLIC_GMAIL_USER || process.env.GMAIL_USER || "";
    if (gmailUser) {
      return `Sophie Garone <${gmailUser}>`;
    }
    if (explicitEmailFrom && !isPlaceholderResendFrom) {
      return explicitEmailFrom;
    }
    return "Sophie Garone <no-reply@yourdomain.hu>";
  }

  if (explicitEmailFrom && !isPlaceholderResendFrom) {
    return explicitEmailFrom;
  }

  return "Sophie Garone <onboarding@resend.dev>";
}

// --- Címzettek a kereskedőnek (több cím is mehet , vagy ; szeparálva) ---
function merchantList() {
  return (process.env.SALES_NOTIFICATIONS_TO || "")
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// --- Tárgyak (testreszabható prefixek) ---
function custPrefix() {
  return process.env.ORDER_EMAIL_SUBJECT_PREFIX || "Rendelésed megérkezett";
}

function merchPrefix() {
  return process.env.ORDER_MERCHANT_EMAIL_SUBJECT_PREFIX || "Új rendelés érkezett";
}

const BRAND: Brand = {
  brandName: "Sophie Garone",
  // No logoUrl – avoids broken-image spam signal until a real hosted logo is available
  primaryColor: "#2C7A7B",
  supportEmail: "writersophiegarone@gmail.com",
  siteUrl: "https://sophiegarone.hu",
  addressLines: ["Sophie Garone", "writersophiegarone@gmail.com"],
  social: [
    { label: "Instagram", url: "https://www.instagram.com/sophiegarone" },
    {
      label: "Facebook",
      url: "https://www.facebook.com/profile.php?id=61576026050694",
    },
    {
      label: "Tiktok",
      url: "https://www.tiktok.com/@sophiegarone",
    },
  ],
};

// Rövid rendelési azonosító a tárgyba (ha nincs orderNo, a Stripe ID utolsó 8 karaktere)
function orderNoForSubject(order: OrderEmailInput) {
  if (order.orderNo) return String(order.orderNo);
  return (order.id || "").slice(-8).toUpperCase() || "RENDELÉS";
}

async function providerSend(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  extraHeaders?: Record<string, string>;
}) {
  const provider = resolveEmailProvider();
  const from = resolveEmailFrom();

  if (provider === "smtp" && !hasSmtpCredentials()) {
    throw new Error("[EMAIL] SMTP provider selected but Gmail/SMTP credentials are missing.");
  }

  if (provider === "resend" && !process.env.RESEND_API_KEY) {
    throw new Error("[EMAIL] Resend provider selected but RESEND_API_KEY is missing.");
  }

  const result =
    provider === "smtp"
      ? await sendEmailSmtp({
          to: opts.to,
          from,
          subject: opts.subject,
          html: opts.html,
          text: opts.text,
          extraHeaders: opts.extraHeaders,
        })
      : await sendEmailResend({
          to: opts.to,
          from,
          subject: opts.subject,
          html: opts.html,
          text: opts.text,
        });

  const reference = emailSendReference(result);
  console.log(
    `[EMAIL] Sent "${opts.subject}" to ${opts.to} via ${provider}; reference=${reference}`
  );
  return result;
}

function emailSendReference(result: unknown): string {
  if (!result || typeof result !== "object") return "unknown";
  const record = result as Record<string, unknown>;
  for (const key of ["messageId", "id", "response"] as const) {
    const value = record[key];
    if (typeof value === "string" && value) return value;
  }
  return "unknown";
}

export { resolveEmailProvider, resolveEmailFrom };

export async function sendOpsAlertEmail(args: {
  subject: string;
  headline: string;
  bodyLines: string[];
}) {
  const recipients = (process.env.SALES_NOTIFICATIONS_TO || "")
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (!recipients.length) {
    console.warn(
      "[OPS_ALERT] SALES_NOTIFICATIONS_TO nincs beállítva – ops értesítés kihagyva."
    );
    return;
  }

  const text = [args.headline, "", ...args.bodyLines].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2 style="color:#b45309;margin:0 0 12px">${args.headline}</h2>
      ${args.bodyLines
        .map((line) =>
          line
            ? `<p style="margin:0 0 8px">${line.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`
            : "<br/>"
        )
        .join("")}
    </div>
  `;

  for (const to of recipients) {
    await providerSend({
      to,
      subject: args.subject,
      html,
      text,
      extraHeaders: {
        "Auto-Submitted": "auto-generated",
        "X-Priority": "1",
        "X-Auto-Response-Suppress": "OOF, DR, RN, NRN, AutoReply",
      },
    });
  }
}

export async function sendOrderEmails(order: OrderEmailInput) {
  const provider = resolveEmailProvider();
  const { user } = getSmtpCredentials();

  console.log(
    `[EMAIL] Sending order emails for #${orderNoForSubject(order)} via ${provider}` +
      (provider === "smtp" && user ? ` (from ${user})` : "")
  );

  let sent = 0;

  // --- VEVŐ (first, awaited before merchant) ---
  if (order.customer_email) {
    const { html, text } = renderCustomerEmail(order, BRAND);
    const subject = `${custPrefix()} — #${orderNoForSubject(order)}`;
    await providerSend({ to: order.customer_email, subject, html, text });
    sent++;
  } else {
    console.warn("[EMAIL] Missing customer_email – skipping customer notification.");
  }

  // --- KERESKEDŐ (after customer, with auto-submitted header to mark as system alert) ---
  if (merchantList().length === 0) {
    console.warn(
      "[EMAIL] SALES_NOTIFICATIONS_TO nincs beállítva – nem küldünk kereskedői értesítést."
    );
  } else {
    const { html, text } = renderMerchantEmail(order, BRAND);
    const subject = `${merchPrefix()} — #${orderNoForSubject(order)}`;
    const merchantHeaders: Record<string, string> = {
      'Auto-Submitted': 'auto-generated',
      'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply',
    };
    for (const to of merchantList()) {
      await providerSend({ to, subject, html, text, extraHeaders: merchantHeaders });
      sent++;
    }
  }

  if (sent === 0) {
    throw new Error("[EMAIL] No order email recipients configured.");
  }
}
