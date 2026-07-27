const ALLOWED_SHIPPING_METHODS = new Set([
  "foxpost_locker",
  "foxpost_courier",
  "foxpost_home",
  "gls_courier",
  "gls_parcelshop",
  "pickup",
]);

const SHIPPING_PRICES_HUF: Record<string, number> = {
  foxpost_locker: 990,
  foxpost_courier: 1390,
  foxpost_home: 1390,
  gls_courier: 1390,
  gls_parcelshop: 990,
  pickup: 0,
};

/** Home-delivery methods share the same internal price tier. */
export const HOME_DELIVERY_METHODS = new Set(["foxpost_courier", "foxpost_home", "courier"]);

function readEnvPrice(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

/**
 * Stripe Price IDs for shipping line items.
 * foxpost_courier uses STRIPE_PRICE_SHIPPING_FOXPOST_COURIER, falling back to
 * STRIPE_PRICE_SHIPPING_FOXPOST_HOME so courier and home stay aligned.
 */
export function resolveStripeShippingPriceId(shippingMethod: string): string | undefined {
  const method = shippingMethod.toLowerCase();

  const byMethod: Record<string, string | undefined> = {
    foxpost_locker: readEnvPrice("STRIPE_PRICE_SHIPPING_FOXPOST_LOCKER"),
    foxpost_home: readEnvPrice("STRIPE_PRICE_SHIPPING_FOXPOST_HOME"),
    foxpost_courier: readEnvPrice(
      "STRIPE_PRICE_SHIPPING_FOXPOST_COURIER",
      "STRIPE_PRICE_SHIPPING_FOXPOST_HOME"
    ),
    courier: readEnvPrice(
      "STRIPE_PRICE_SHIPPING_FOXPOST_COURIER",
      "STRIPE_PRICE_SHIPPING_FOXPOST_HOME",
      "STRIPE_PRICE_SHIPPING_COURIER"
    ),
    gls_courier: readEnvPrice(
      "STRIPE_PRICE_SHIPPING_GLS",
      "STRIPE_PRICE_SHIPPING_COURIER"
    ),
    gls_parcelshop: readEnvPrice("STRIPE_PRICE_SHIPPING_GLS"),
    pickup: undefined,
  };

  return byMethod[method] || readEnvPrice("STRIPE_PRICE_SHIPPING_ID");
}

/** Foxpost parcel API only supports locker vs home — map courier to home. */
export function resolveFoxpostFulfillmentMethod(
  shippingMethod: string | null | undefined
): "foxpost_locker" | "foxpost_home" | null {
  const method = String(shippingMethod || "").toLowerCase();
  if (method === "foxpost_locker") return "foxpost_locker";
  if (HOME_DELIVERY_METHODS.has(method) || method === "foxpost_home") {
    return "foxpost_home";
  }
  return null;
}

const MAX_QTY_PER_LINE = 99;
export const MAX_NOTE_LENGTH = 500;
const MAX_NAME_LENGTH = 120;
const MAX_ADDRESS_LENGTH = 200;
const MAX_CITY_LENGTH = 80;
const MAX_ZIP_LENGTH = 12;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 32;
const MAX_VAT_LENGTH = 32;

export type SanitizedAddress = {
  name: string;
  email: string;
  phone: string;
  zip: string;
  city: string;
  address: string;
  vat?: string;
};

export type NormalizedCartLine = {
  productId: string;
  quantity: number;
};

export function validateCheckoutOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) {
    // Same-origin fetch from browser may omit Origin; allow in dev only.
    return process.env.NODE_ENV !== "production";
  }

  const allowed = new Set<string>();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (siteUrl) {
    try {
      const parsed = new URL(siteUrl);
      allowed.add(parsed.origin);
      // Accept both www and apex hostnames for the configured site.
      const host = parsed.hostname.replace(/^www\./, "");
      allowed.add(`${parsed.protocol}//${host}`);
      allowed.add(`${parsed.protocol}//www.${host}`);
    } catch {
      // ignore invalid env URL
    }
  }
  allowed.add("http://localhost:3000");
  allowed.add("http://127.0.0.1:3000");

  return allowed.has(origin);
}

export function sanitizeText(value: unknown, maxLen: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLen);
}

export function sanitizeEmail(value: unknown): string | null {
  const email = sanitizeText(value, MAX_EMAIL_LENGTH).toLowerCase();
  if (!email || email.length > MAX_EMAIL_LENGTH) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function sanitizePhone(value: unknown): string {
  return sanitizeText(value, MAX_PHONE_LENGTH).replace(/[^\d+\s()-]/g, "");
}

export function sanitizeAddress(
  input: Record<string, unknown> | undefined,
  fallbackEmail: string,
  fallbackPhone: string
): SanitizedAddress {
  return {
    name: sanitizeText(input?.name, MAX_NAME_LENGTH),
    email: fallbackEmail,
    phone: fallbackPhone,
    zip: sanitizeText(input?.zip, MAX_ZIP_LENGTH),
    city: sanitizeText(input?.city, MAX_CITY_LENGTH),
    address: sanitizeText(input?.address, MAX_ADDRESS_LENGTH),
    vat: sanitizeText(input?.vat, MAX_VAT_LENGTH) || undefined,
  };
}

export function normalizeShippingMethod(value: unknown): string {
  const method = sanitizeText(value, 40).toLowerCase();
  return ALLOWED_SHIPPING_METHODS.has(method) ? method : "foxpost_locker";
}

export function computeShippingHUF(shippingMethod: string): number {
  const method = shippingMethod.toLowerCase();
  if (HOME_DELIVERY_METHODS.has(method)) {
    return SHIPPING_PRICES_HUF.foxpost_home;
  }
  return SHIPPING_PRICES_HUF[method] ?? 0;
}


export function normalizeCartLines(
  items: unknown,
  resolveId: (id: string) => string
): NormalizedCartLine[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("A kosár üres.");
  }
  if (items.length > 50) {
    throw new Error("Túl sok tétel a kosárban.");
  }

  const lines: NormalizedCartLine[] = [];
  for (const raw of items) {
    const item = raw as { id?: unknown; quantity?: unknown; qty?: unknown };
    const productId = resolveId(sanitizeText(item.id, 64));
    if (!productId) throw new Error("Érvénytelen termék a kosárban.");

    const qtyRaw = Number(item.quantity ?? item.qty ?? 1);
    const quantity = Number.isFinite(qtyRaw)
      ? Math.min(MAX_QTY_PER_LINE, Math.max(1, Math.round(qtyRaw)))
      : 1;

    lines.push({ productId, quantity });
  }

  return lines;
}

export function computeOrderTotals(args: {
  lines: NormalizedCartLine[];
  products: Map<string, { priceHUF: number; stock: number }>;
  shippingMethod: string;
}): {
  subtotalHUF: number;
  shippingHUF: number;
  discountHUF: number;
  totalHUF: number;
} {
  let subtotalHUF = 0;

  for (const line of args.lines) {
    const product = args.products.get(line.productId);
    if (!product) throw new Error("Ismeretlen termék a kosárban.");
    if (product.stock < line.quantity) {
      throw new Error("A kért mennyiség nem áll rendelkezésre raktáron.");
    }
    subtotalHUF += Number(product.priceHUF) * line.quantity;
  }

  const shippingHUF = computeShippingHUF(args.shippingMethod);
  const discountHUF = 0;
  const totalHUF = Math.max(0, subtotalHUF + shippingHUF - discountHUF);

  if (subtotalHUF <= 0) {
    throw new Error("Érvénytelen rendelési összeg.");
  }

  return { subtotalHUF, shippingHUF, discountHUF, totalHUF };
}

export async function assertPendingOrderRateLimit(userEmail: string): Promise<void> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const { prisma } = await import("@/app/lib/prisma");
  const pendingCount = await prisma.order.count({
    where: {
      userEmail,
      status: "PENDING",
      createdAt: { gte: since },
    },
  });

  if (pendingCount >= 8) {
    throw new Error("Túl sok függőben lévő rendelés. Kérjük, próbáld újra később.");
  }
}
