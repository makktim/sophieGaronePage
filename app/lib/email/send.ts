import { sendEmailResend } from "./providers/resend";
import { sendEmailSmtp } from "./providers/smtp";
import {
  renderCustomerEmail,
  type OrderEmailInput,
  type Brand,
} from "./templates/orderCustomer";
import { renderMerchantEmail } from "./templates/orderMerchant";

// --- Provider & feladó ---
const provider = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();
const from = process.env.EMAIL_FROM || "Sophie Garone <no-reply@yourdomain.hu>";

// --- Címzettek a kereskedőnek (több cím is mehet , vagy ; szeparálva) ---
const merchantList = (process.env.SALES_NOTIFICATIONS_TO || "")
  .split(/[;,]/)
  .map((s) => s.trim())
  .filter(Boolean);

// --- Tárgyak (testreszabható prefixek) ---
const CUST_PREFIX =
  process.env.ORDER_EMAIL_SUBJECT_PREFIX || "Rendelésed megérkezett";
const MERCH_PREFIX =
  process.env.ORDER_MERCHANT_EMAIL_SUBJECT_PREFIX || "Új rendelés érkezett";

const BRAND: Brand = {
  brandName: "Sophie Garone",
  logoUrl: "https://yourdomain.hu/logo-email.png",
  primaryColor: "#2C7A7B",
  supportEmail: "writersophiegarone@gmail.com",
  siteUrl: "https://sophiegarone.hu",
  addressLines: ["Sophie Garone Kft.", "1234 Budapest, Példa utca 1."],
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

function providerSend(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  return provider === "smtp"
    ? sendEmailSmtp({
        to: opts.to,
        from,
        subject: opts.subject,
        html: opts.html,
      })
    : sendEmailResend({
        to: opts.to,
        from,
        subject: opts.subject,
        html: opts.html,
      });
}

export async function sendOrderEmails(order: OrderEmailInput) {
  const tasks: Promise<unknown>[] = [];

  // --- VEVŐ ---
  if (order.customer_email) {
    const { html, text } = renderCustomerEmail(order, BRAND);
    const subject = `${CUST_PREFIX} — #${orderNoForSubject(order)}`;
    tasks.push(providerSend({ to: order.customer_email, subject, html, text }));
  }

  // --- KERESKEDŐ ---
  if (merchantList.length === 0) {
    console.warn(
      "[EMAIL] SALES_NOTIFICATIONS_TO nincs beállítva – nem küldünk kereskedői értesítést."
    );
  } else {
    const { html, text } = renderMerchantEmail(order, BRAND);
    const subject = `${MERCH_PREFIX} — #${orderNoForSubject(order)}`;
    for (const to of merchantList) {
      tasks.push(providerSend({ to, subject, html, text }));
    }
  }

  await Promise.all(tasks);
}
