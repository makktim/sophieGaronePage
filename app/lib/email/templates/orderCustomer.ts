// app/lib/email/templates/orderCustomer.ts

// ===== Types =====
type LineItem = {
  description: string | null;
  quantity: number | null;
  amount_total: number | null; // HUF-ban (major unit, de Stripe néha ×100-at ad)
};

type Address = {
  name?: string;
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
  amount_total: number; // HUF-ban (major unit, de Stripe néha ×100-at ad)
  currency: string; // pl. "HUF"
  payment_status?: string; // "paid" | "cod" | "succeeded" | ...
  payment_label?: string; // magyar felirat: "Bankkártya (Stripe)" | "Utánvét"
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

const ZERO_DECIMAL = new Set(["HUF", "JPY", "KRW"]);
const CURRENCY_LOCALE: Record<string, string> = { HUF: "hu-HU" };

function normalizeAmount(amount?: number | null, currency = "HUF") {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 0;
  const cur = (currency || "HUF").toUpperCase();

  // Zero-decimal (HUF, JPY, KRW) – Stripe néha minor unitban küld (×100).
  // Osztunk 100-zal, ha kerek száz és "elég nagy", hogy skálázott legyen.
  if (ZERO_DECIMAL.has(cur)) {
    if (n % 100 === 0 && n >= 10_000) {
      // 99 000 -> 990; 189 000 -> 1 890; 629 000 -> 6 290
      return Math.round(n / 100);
    }
  }
  return n;
}

function money(amount?: number | null, currency = "HUF") {
  const locale = CURRENCY_LOCALE[currency] || "hu-HU";
  const safe = normalizeAmount(amount, currency);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(safe);
  } catch {
    return `${Math.round(safe)} ${currency}`;
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

function isShippingItem(li: LineItem) {
  return (li?.description || "").toLowerCase().includes("szállítás");
}

function sumLineItems(
  items: LineItem[] | undefined,
  currency: string,
  filter?: (li: LineItem) => boolean
) {
  const list = (items || []).filter((li) => (filter ? filter(li) : true));
  return list.reduce(
    (acc, li) => acc + normalizeAmount(li.amount_total, currency),
    0
  );
}

function paymentLabel(order: OrderEmailInput) {
  if (order.payment_label) return order.payment_label;
  const s = (order.payment_status || "").toLowerCase();
  if (s === "cod") return "Utánvét";
  if (s === "paid" || s === "succeeded") return "Bankkártya (Stripe)";
  return s || "-";
}

// ===== Renderer =====
export function renderCustomerEmail(order: OrderEmailInput, brand: Brand) {
  const orderNo = order.orderNo || shortId(order.id);
  const prefix =
    process.env.ORDER_EMAIL_SUBJECT_PREFIX || "Rendelés visszaigazolás";

  // --- Normalizált összegek (ha nincs totals, tételekből számol) ---
  const liShipping = sumLineItems(
    order.line_items,
    order.currency,
    isShippingItem
  );
  const liGoods = sumLineItems(
    order.line_items,
    order.currency,
    (li) => !isShippingItem(li)
  );

  const rawSubtotal = order.totals?.subtotal;
  const rawShipping = order.totals?.shipping;
  const rawDiscount = order.totals?.discount;
  const rawTotal = order.totals?.total ?? order.amount_total;

  const subtotal =
    rawSubtotal != null
      ? normalizeAmount(rawSubtotal, order.currency)
      : liGoods;

  const shipping =
    rawShipping != null
      ? normalizeAmount(rawShipping, order.currency)
      : liShipping;

  const discount = normalizeAmount(rawDiscount, order.currency);
  const computedTotal = Math.max(0, subtotal + shipping - discount);
  const normalizedRawTotal = normalizeAmount(rawTotal, order.currency);
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

  const methodText = shipMethodLabel(methodKey);

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
    ``,
    `Tételek:`,
    ...(order.line_items || []).map(
      (li) => `• ${li.quantity || 1} × ${li.description || ""}`
    ),
    ``,
    `Részösszeg: ${money(subtotal, order.currency)}`,
    `Szállítás: ${money(shipping, order.currency)}`,
    discount ? `Kedvezmény: -${money(discount, order.currency)}` : ``,
    `Végösszeg: ${money(total, order.currency)}`,
    ``,
    `Szállítási mód: ${methodText}`,
    isLocker
      ? order.pickupPointLabel
        ? `Átvevőpont: ${order.pickupPointLabel}`
        : order.pickupPoint?.name
        ? `Átvevőpont: ${order.pickupPoint.name} – ${
            order.pickupPoint.address || ""
          }`
        : ``
      : ``,
    shippingAddr
      ? `Szállítási cím: ${shippingAddr.name || ""}, ${
          shippingAddr.zip || ""
        } ${shippingAddr.city || ""}, ${shippingAddr.address || ""}`
      : ``,
    order.billing
      ? `Számlázási cím: ${order.billing.name || ""}, ${
          order.billing.zip || ""
        } ${order.billing.city || ""}, ${order.billing.address || ""}`
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

      // Szállítás TOTAL: a totals.shipping az igazság; ha nincs, esünk vissza a li.amount_total-ra (normálva)
      const totalLi = isShip
        ? normalizeAmount(
            order.totals?.shipping ?? li.amount_total,
            order.currency
          )
        : normalizeAmount(li.amount_total, order.currency);

      const unit = qty ? Math.round(totalLi / qty) : totalLi;

      // Szállítás leírás: label a shippingMethod alapján (szebb, mint egyszerű "Szállítás")
      const desc = isShip
        ? shipMethodLabel(order.shippingMethod)
        : li.description || "";

      return `
          <tr>
            <td>${esc(desc)}</td>
            <td class="right">${qty}</td>
            <td class="right hide-sm">${money(unit, order.currency)}</td>
            <td class="right">${money(totalLi, order.currency)}</td>
          </tr>`;
    })
    .join("")}
</tbody>
        </table>
      </td></tr>

      <tr><td class="card">
        <table class="sum-table" role="presentation" width="100%">
          <tr><td class="label">Részösszeg</td><td class="right">${money(
            subtotal,
            order.currency
          )}</td></tr>
          <tr><td class="label">Szállítás</td><td class="right">${money(
            shipping,
            order.currency
          )}</td></tr>
          ${
            discount
              ? `<tr><td class="label">Kedvezmény</td><td class="right">−${money(
                  discount,
                  order.currency
                )}</td></tr>`
              : ``
          }
          <tr class="grand"><td>Végösszeg</td><td class="right">${money(
            total,
            order.currency
          )}</td></tr>
        </table>
      </td></tr>

      <tr><td class="card">
        <table class="cols" role="presentation" width="100%">
          <tr>
            <td>
              <div class="box">
                <strong>Szállítás</strong><br>
                ${esc(methodText)}
                ${
                  isLocker
                    ? `
                      <div class="muted" style="margin-top:6px">
                        <div><strong>${esc(
                          order.pickupPoint?.name || ""
                        )}</strong></div>
                        <div>${esc(order.pickupPoint?.address || "")}</div>
                      </div>`
                    : ``
                }
              </div>
            </td>
            <td>
              <div class="box">
                <strong>Szállítási cím</strong><br>
                ${
                  shippingAddr
                    ? `
                  ${esc(shippingAddr.name || "")}<br>
                  ${esc(shippingAddr.address || "")}<br>
                  ${esc(
                    [shippingAddr.zip, shippingAddr.city]
                      .filter(Boolean)
                      .join(" ")
                  )}<br>
                  ${esc(shippingAddr.country || "Magyarország")}
                `
                    : `<span class="muted">—</span>`
                }
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:12px">
              <div class="box">
                <strong>Számlázási cím</strong><br>
                ${
                  order.billing
                    ? `
                  ${esc(order.billing.name || "")}<br>
                  ${esc(order.billing.address || "")}<br>
                  ${esc(
                    [order.billing.zip, order.billing.city]
                      .filter(Boolean)
                      .join(" ")
                  )}<br>
                  ${esc(order.billing.country || "Magyarország")}
                `
                    : `<span class="muted">—</span>`
                }
              </div>
            </td>
            <td style="padding-top:12px">
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
