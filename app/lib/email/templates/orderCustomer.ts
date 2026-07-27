// app/lib/email/templates/orderCustomer.ts

import {
  formatBankTransferInstructions,
  getBankTransferDetails,
  isTransferPayment,
} from "@/app/lib/bankTransfer";

// ===== Types =====
type LineItem = {
  description: string | null;
  quantity: number | null;
  amount_total: number | null; // HUF-ban (major unit, de Stripe néha ×100-at ad)
};

type Address = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
};

type PickupPoint = {
  carrier?: "GLS" | "FOXPOST" | "PACKETA";
  id?: string;
  name?: string;
  address?: string;
};

type Totals = {
  subtotal?: number;
  shipping?: number;
  discount?: number;
  total?: number;
};

export type OrderEmailInput = {
  id: string;
  createdAt?: string; // ISO
  /** Order total in whole forints unless amountScale is 100. */
  amount_total: number;
  currency: string; // pl. "HUF"
  payment_status?: string; // "paid" | "cod" | "transfer" | "succeeded" | ...
  payment_label?: string; // magyar felirat: "Bankkártya (Stripe)" | "Utánvét" | "Átutalás"
  customer_email: string;
  customer_name?: string;

  billing?: Address | null;
  shipping?: Address | null;

  // "foxpost_locker" | "foxpost_courier" | "foxpost_home" | "pickup" | ...
  shippingMethod?: string;

  // Foxpost automata / harmadik fél átvevőpont adatok
  pickupPoint?: PickupPoint | null;
  // előre legenerált felirat (pl. "FOXPOST ... — 1027 Budapest, ...")
  pickupPointLabel?: string;

  note?: string;
  line_items: LineItem[];
  totals?: Totals;

  orderUrl?: string;
  orderNo?: string;

  /**
   * How monetary fields are encoded.
   * - 1 (default): whole forints from our DB / order records
   * - 100: Stripe-style HUF amounts stored as forints × 100
   */
  amountScale?: 1 | 100;
};

export type Brand = {
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  supportEmail?: string;
  siteUrl?: string;
  addressLines?: string[];
  social?: { label: string; url: string }[];
};

// ===== Utils =====
function shortId(id: string) {
  return (id || "").slice(-8).toUpperCase();
}

const CURRENCY_LOCALE: Record<string, string> = { HUF: "hu-HU" };

function resolveAmountScale(scale?: 1 | 100): 1 | 100 {
  return scale === 100 ? 100 : 1;
}

/** Convert stored amount to whole forints for display. */
function toMajorAmount(
  amount?: number | null,
  scale: 1 | 100 = 1
): number {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 0;
  return scale === 100 ? Math.round(n / 100) : Math.round(n);
}

function formatMoney(amountMajor: number, currency = "HUF") {
  const locale = CURRENCY_LOCALE[currency] || "hu-HU";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amountMajor);
  } catch {
    return `${Math.round(amountMajor)} ${currency}`;
  }
}

function esc(s?: string | null) {
  return String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!)
  );
}

function shipMethodLabel(key?: string) {
  switch (key) {
    case "foxpost_locker":
      return "Foxpost automata";
    case "foxpost_home":
    case "foxpost_courier":
      return "Foxpost házhozszállítás";
    case "pickup":
      return "Személyes átvétel";
    case "gls_courier":
      return "GLS futár";
    default:
      return "Szállítás";
  }
}

function pickupPointDisplay(order: OrderEmailInput): {
  name: string;
  address: string;
  label: string;
} | null {
  if (order.pickupPointLabel?.trim()) {
    const label = order.pickupPointLabel.trim();
    return {
      name: order.pickupPoint?.name?.trim() || label,
      address: order.pickupPoint?.address?.trim() || "",
      label,
    };
  }
  const name = order.pickupPoint?.name?.trim() || "";
  const address = order.pickupPoint?.address?.trim() || "";
  if (!name && !address) return null;
  return {
    name,
    address,
    label: [name, address].filter(Boolean).join(" — "),
  };
}

/** Shipping method label, including Foxpost terminal name when available. */
function formatShippingMethodText(order: OrderEmailInput, methodKey?: string) {
  const base = shipMethodLabel(methodKey || order.shippingMethod);
  const pickup = pickupPointDisplay(order);
  if (
    (methodKey === "foxpost_locker" ||
      order.shippingMethod === "foxpost_locker" ||
      !!order.pickupPoint) &&
    pickup?.name
  ) {
    return `${base} – ${pickup.name}`;
  }
  return base;
}

function resolveCustomerPhone(order: OrderEmailInput): string {
  return (
    order.shipping?.phone ||
    order.billing?.phone ||
    ""
  ).trim();
}

function formatAddressBlock(addr?: Address | null): string {
  if (!addr) return `<span class="muted">—</span>`;
  const lines = [
    addr.name,
    addr.address,
    [addr.zip, addr.city].filter(Boolean).join(" "),
    addr.country || "Magyarország",
  ].filter(Boolean);
  return lines.map((line) => esc(line)).join("<br>");
}

function isShippingItem(li: LineItem) {
  return (li?.description || "").toLowerCase().includes("szállítás");
}

function sumLineItems(
  items: LineItem[] | undefined,
  scale: 1 | 100,
  filter?: (li: LineItem) => boolean
) {
  const list = (items || []).filter((li) => (filter ? filter(li) : true));
  return list.reduce(
    (acc, li) => acc + toMajorAmount(li.amount_total, scale),
    0
  );
}

function paymentLabel(order: OrderEmailInput) {
  if (order.payment_label) return order.payment_label;
  const s = (order.payment_status || "").toLowerCase();
  if (s === "transfer" || s === "bank_transfer") return "Átutalás";
  if (s === "cod") return "Utánvét";
  if (s === "paid" || s === "succeeded") return "Bankkártya (Stripe)";
  return s || "-";
}

function transferInstructionsBlock(order: OrderEmailInput, orderNo: string) {
  if (!isTransferPayment(order)) return { textExtra: [] as string[], htmlExtra: "" };
  const details = getBankTransferDetails();
  if (!details) return { textExtra: [] as string[], htmlExtra: "" };
  const { textLines, htmlBlock } = formatBankTransferInstructions(orderNo, details);
  return { textExtra: ["", ...textLines], htmlExtra: htmlBlock };
}

// ===== Renderer =====
export function renderCustomerEmail(order: OrderEmailInput, brand: Brand) {
  const orderNo = order.orderNo || shortId(order.id);
  const prefix =
    process.env.ORDER_EMAIL_SUBJECT_PREFIX || "Rendelés visszaigazolás";
  const scale = resolveAmountScale(order.amountScale);
  // `money` formats amounts that are already in whole forints.
  const money = (amountMajor?: number | null) =>
    formatMoney(Math.round(Number(amountMajor) || 0), order.currency);

  // --- Normalizált összegek (ha nincs totals, tételekből számol) ---
  const liShipping = sumLineItems(order.line_items, scale, isShippingItem);
  const liGoods = sumLineItems(
    order.line_items,
    scale,
    (li) => !isShippingItem(li)
  );

  const rawSubtotal = order.totals?.subtotal;
  const rawShipping = order.totals?.shipping;
  const rawDiscount = order.totals?.discount;
  const rawTotal = order.totals?.total ?? order.amount_total;

  const subtotal =
    rawSubtotal != null ? toMajorAmount(rawSubtotal, scale) : liGoods;

  const shipping =
    rawShipping != null ? toMajorAmount(rawShipping, scale) : liShipping;

  const discount = toMajorAmount(rawDiscount, scale);
  const computedTotal = Math.max(0, subtotal + shipping - discount);
  const normalizedRawTotal = toMajorAmount(rawTotal, scale);
  const total =
    Math.abs(normalizedRawTotal - computedTotal) <= 5
      ? normalizedRawTotal
      : computedTotal;

  // --- Szállítási mód következtetés ---
  const sm = (order.shippingMethod || "").toLowerCase();
  const isLocker = sm === "foxpost_locker" || !!order.pickupPoint;
  const isHome =
    !isLocker &&
    (sm === "foxpost_courier" || sm === "foxpost_home" || shipping > 0);

  const methodKey = isLocker
    ? "foxpost_locker"
    : isHome
    ? "foxpost_courier"
    : shipping === 0
    ? "pickup"
    : undefined;

  const methodText = formatShippingMethodText(order, methodKey);
  const pickup = pickupPointDisplay(order);
  const customerPhone = resolveCustomerPhone(order);
  const customerEmail = order.customer_email || order.billing?.email || order.shipping?.email || "";
  const customerName =
    order.customer_name ||
    order.shipping?.name ||
    order.billing?.name ||
    "";
  const transferBlock = transferInstructionsBlock(order, orderNo);

  // Házhozszállításnál, ha nincs külön shipping cím, essünk vissza billingre
  const shippingAddr: Address | null =
    order.shipping || (isHome ? order.billing || null : null);

  const brandColor = brand.primaryColor || "#111827";
  const logo = brand.logoUrl
    ? `<img src="${esc(brand.logoUrl)}" alt="${esc(
        brand.brandName
      )}" width="120" style="display:block; height:auto;">`
    : `<span style="font-weight:700;font-size:16px;color:#111827">${esc(
        brand.brandName || "Márka"
      )}</span>`;

  // --- PLAINTEXT fallback ---
  const text = [
    `${brand.brandName} – Rendelés visszaigazolás`,
    ``,
    `Rendelés azonosító: ${orderNo}`,
    order.createdAt
      ? `Dátum: ${new Date(order.createdAt).toLocaleString("hu-HU")}`
      : ``,
    `Fizetési mód: ${paymentLabel(order)}`,
    ...transferBlock.textExtra,
    ``,
    `Vásárló adatai:`,
    customerName ? `Név: ${customerName}` : ``,
    customerEmail ? `E-mail: ${customerEmail}` : ``,
    customerPhone ? `Telefon: ${customerPhone}` : ``,
    ``,
    `Tételek:`,
    ...(order.line_items || []).map(
      (li) => `• ${li.quantity || 1} × ${li.description || ""}`
    ),
    ``,
    `Részösszeg: ${money(subtotal)}`,
    `Szállítás: ${money(shipping)}`,
    discount ? `Kedvezmény: -${money(discount)}` : ``,
    `Végösszeg: ${money(total)}`,
    ``,
    `Szállítási mód: ${methodText}`,
    isLocker && pickup
      ? `Foxpost automata neve: ${pickup.name}${
          pickup.address ? ` (${pickup.address})` : ""
        }`
      : ``,
    shippingAddr
      ? `Szállítási cím: ${shippingAddr.name || ""}, ${
          shippingAddr.zip || ""
        } ${shippingAddr.city || ""}, ${shippingAddr.address || ""}${
          shippingAddr.phone ? `, Tel: ${shippingAddr.phone}` : ""
        }`
      : ``,
    order.billing
      ? `Számlázási cím: ${order.billing.name || ""}, ${
          order.billing.zip || ""
        } ${order.billing.city || ""}, ${order.billing.address || ""}${
          order.billing.phone ? `, Tel: ${order.billing.phone}` : ""
        }${order.billing.email ? `, E-mail: ${order.billing.email}` : ""}`
      : ``,
    order.note ? `Megjegyzés: ${order.note}` : ``,
    ``,
    brand.supportEmail ? `Kérdés esetén: ${brand.supportEmail}` : ``,
    brand.siteUrl
      ? `Rendelés megtekintése: ${order.orderUrl || brand.siteUrl}`
      : ``,
  ]
    .filter(Boolean)
    .join("\n");

  // --- HTML ---
  const html = `<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<meta name="x-apple-disable-message-reformatting">
<title>Rendelés visszaigazolás – ${esc(brand.brandName)}</title>
<style>
  body { margin:0; padding:0; background:#f6f8fa; color:#111827; font-family:-apple-system, Segoe UI, Roboto, Arial, sans-serif; -webkit-font-smoothing:antialiased; }
  table { border-collapse:collapse; }
  img { border:0; max-width:100%; height:auto; }
  a { color:${brandColor}; text-decoration:none; }
  .wrapper { width:100%; background:#f6f8fa; padding:24px 12px; }
  .container { width:100%; max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:14px; overflow:hidden; }
  .header { padding:18px 20px; background:#ffffff; border-bottom:1px solid #e5e7eb; }
  .brand { display:flex; align-items:center; gap:12px; }
  .hero { padding:24px 20px 8px; }
  .hero h1 { margin:0 0 8px; font-size:22px; line-height:1.2; color:#111827; }
  .muted { color:#6b7280; }
  .orderid { word-break:break-all; font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  .card { padding:14px 20px; }
  .items th, .items td { padding:12px 8px; font-size:14px; border-bottom:1px solid #e5e7eb; }
  .items th { text-align:left; color:#6b7280; font-weight:600; }
  .right { text-align:right; }
  .sum-table td { padding:10px 8px; }
  .sum-table .label { color:#6b7280; }
  .grand td { font-size:16px; font-weight:700; }
  .cols { width:100%; }
  .cols td { vertical-align:top; width:50%; padding:0; }
  .box { background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:14px; }
  .btn-wrap { text-align:center; padding:18px 20px 26px; }
  .btn { display:inline-block; background:${brandColor}; color:#ffffff !important; padding:12px 18px; border-radius:10px; font-weight:700; }
  .footer { padding:16px 20px; color:#6b7280; font-size:12px; text-align:center; }
  .social a { margin:0 6px; color:#6b7280; }
  @media (max-width: 640px) {
    .hide-sm { display:none !important; }
    .cols td { display:block; width:100%; padding-top:12px; }
  }
</style>
</head>
<body>
  <div class="wrapper">
    <table class="container" role="presentation" cellpadding="0" cellspacing="0">
      <tr><td class="header"><div class="brand">${logo}</div></td></tr>

      <tr><td class="hero">
        <h1>Köszönjük a rendelésed!</h1>
        <div class="muted">Rendelés azonosító:
          <strong class="orderid">#${esc(orderNo)}</strong>
        </div>
        ${
          order.createdAt
            ? `<div class="muted">Dátum: ${esc(
                new Date(order.createdAt).toLocaleString("hu-HU")
              )}</div>`
            : ``
        }
        <div class="muted">Fizetési mód: ${esc(paymentLabel(order))}</div>
        ${transferBlock.htmlExtra}
      </td></tr>

      <tr><td class="card">
        <table class="items" role="presentation" width="100%">
          <thead>
            <tr>
              <th>Tétel</th>
              <th class="right">Menny.</th>
              <th class="right hide-sm">Egységár</th>
              <th class="right">Összesen</th>
            </tr>
          </thead>
<tbody>
  ${(order.line_items || [])
    .map((li) => {
      const isShip = isShippingItem(li);
      const qty = isShip ? 1 : li.quantity || 1;

      // Szállítás TOTAL: a totals.shipping az igazság; ha nincs, esünk vissza a li.amount_total-ra
      const totalLi = isShip
        ? toMajorAmount(
            order.totals?.shipping ?? li.amount_total,
            scale
          )
        : toMajorAmount(li.amount_total, scale);

      const unit = qty ? Math.round(totalLi / qty) : totalLi;

      // Szállítás leírás: label a shippingMethod alapján (szebb, mint egyszerű "Szállítás")
      const desc = isShip
        ? formatShippingMethodText(order, order.shippingMethod)
        : li.description || "";

      return `
          <tr>
            <td>${esc(desc)}</td>
            <td class="right">${qty}</td>
            <td class="right hide-sm">${money(unit)}</td>
            <td class="right">${money(totalLi)}</td>
          </tr>`;
    })
    .join("")}
</tbody>
        </table>
      </td></tr>

      <tr><td class="card">
        <table class="sum-table" role="presentation" width="100%">
          <tr><td class="label">Részösszeg</td><td class="right">${money(
            subtotal
          )}</td></tr>
          <tr><td class="label">Szállítás</td><td class="right">${money(
            shipping
          )}</td></tr>
          ${
            discount
              ? `<tr><td class="label">Kedvezmény</td><td class="right">−${money(
                  discount
                )}</td></tr>`
              : ``
          }
          <tr class="grand"><td>Végösszeg</td><td class="right">${money(
            total
          )}</td></tr>
        </table>
      </td></tr>

      <tr><td class="card">
        <table class="cols" role="presentation" width="100%">
          <tr>
            <td>
              <div class="box">
                <strong>Vásárló adatai</strong><br>
                ${customerName ? `${esc(customerName)}<br>` : ""}
                ${
                  customerEmail
                    ? `E-mail: <a href="mailto:${esc(customerEmail)}">${esc(
                        customerEmail
                      )}</a><br>`
                    : ""
                }
                ${
                  customerPhone
                    ? `Telefon: <a href="tel:${esc(
                        customerPhone.replace(/\s+/g, "")
                      )}">${esc(customerPhone)}</a>`
                    : customerEmail
                    ? ""
                    : `<span class="muted">—</span>`
                }
              </div>
            </td>
            <td>
              <div class="box">
                <strong>Szállítás</strong><br>
                ${esc(methodText)}
                ${
                  isLocker && pickup
                    ? `
                      <div class="muted" style="margin-top:6px">
                        <div><strong>Foxpost automata neve:</strong></div>
                        <div><strong>${esc(pickup.name)}</strong></div>
                        ${
                          pickup.address
                            ? `<div>${esc(pickup.address)}</div>`
                            : ""
                        }
                      </div>`
                    : ``
                }
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:12px">
              <div class="box">
                <strong>Szállítási cím</strong><br>
                ${
                  isLocker && pickup
                    ? `
                  ${esc(customerName || shippingAddr?.name || "")}<br>
                  <span class="muted">Átvétel:</span> ${esc(pickup.name)}<br>
                  ${esc(pickup.address || "")}
                  ${
                    customerPhone
                      ? `<br>Tel: ${esc(customerPhone)}`
                      : shippingAddr?.phone
                      ? `<br>Tel: ${esc(shippingAddr.phone)}`
                      : ""
                  }
                `
                    : formatAddressBlock(shippingAddr)
                }
                ${
                  !isLocker && shippingAddr?.phone
                    ? `<br>Tel: ${esc(shippingAddr.phone)}`
                    : ""
                }
                ${
                  !isLocker && shippingAddr?.email
                    ? `<br>E-mail: ${esc(shippingAddr.email)}`
                    : ""
                }
              </div>
            </td>
            <td style="padding-top:12px">
              <div class="box">
                <strong>Számlázási cím</strong><br>
                ${formatAddressBlock(order.billing)}
                ${
                  order.billing?.phone
                    ? `<br>Tel: ${esc(order.billing.phone)}`
                    : ""
                }
                ${
                  order.billing?.email
                    ? `<br>E-mail: ${esc(order.billing.email)}`
                    : ""
                }
              </div>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:12px">
              <div class="box">
                <strong>Megjegyzés</strong><br>
                ${order.note ? esc(order.note) : `<span class="muted">—</span>`}
              </div>
            </td>
          </tr>
        </table>
      </td></tr>

      ${
        order.orderUrl || brand.siteUrl
          ? `
      <tr><td class="btn-wrap">
        <a class="btn" href="${esc(
          order.orderUrl || brand.siteUrl!
        )}" target="_blank" rel="noopener">Rendelés megtekintése</a>
      </td></tr>`
          : ``
      }

      <tr><td class="footer">
        ${
          brand.supportEmail
            ? `Kérdés esetén írj: <a href="mailto:${esc(
                brand.supportEmail
              )}">${esc(brand.supportEmail)}</a><br>`
            : ``
        }
        ${
          brand.addressLines?.length
            ? `<div style="margin-top:8px">${brand.addressLines
                .map(esc)
                .join("<br>")}</div>`
            : ``
        }
        ${
          brand.social?.length
            ? `<div class="social" style="margin-top:10px">${brand.social
                .map(
                  (s) =>
                    `<a href="${esc(
                      s.url
                    )}" target="_blank" rel="noopener">${esc(s.label)}</a>`
                )
                .join(" · ")}</div>`
            : ``
        }
      </td></tr>
    </table>
  </div>
</body>
</html>`;

  const subject = `${prefix} — #${orderNo}`;
  return { subject, html, text };
}
