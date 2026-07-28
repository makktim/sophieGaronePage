import test from "node:test";
import assert from "node:assert/strict";
import {
  computeOrderTotals,
  normalizeCartLines,
  resolveFoxpostFulfillmentMethod,
  resolveStripeShippingPriceId,
  sanitizeEmail,
  sanitizeText,
} from "./checkoutSecurity";
import { resolveProductId } from "./productCatalog";

test("sanitizeEmail rejects invalid addresses", () => {
  assert.equal(sanitizeEmail("not-an-email"), null);
  assert.equal(sanitizeEmail("buyer@example.com"), "buyer@example.com");
});

test("normalizeCartLines resolves aliases and clamps quantity", () => {
  const lines = normalizeCartLines(
    [{ id: "book-ego-es-fold-kozott", quantity: 200 }],
    resolveProductId
  );
  assert.equal(lines.length, 1);
  assert.equal(lines[0].productId, "036e509c-9202-46ca-9e30-a0239324dfba");
  assert.equal(lines[0].quantity, 99);
});

test("computeOrderTotals uses server product prices only", () => {
  const products = new Map([
    ["p1", { priceHUF: 5669, stock: 5 }],
    ["p2", { priceHUF: 6299, stock: 2 }],
  ]);

  const totals = computeOrderTotals({
    lines: [
      { productId: "p1", quantity: 2 },
      { productId: "p2", quantity: 1 },
    ],
    products,
    shippingMethod: "foxpost_locker",
  });

  assert.equal(totals.subtotalHUF, 5669 * 2 + 6299);
  assert.equal(totals.shippingHUF, 1190);
  assert.equal(totals.discountHUF, 0);
  assert.equal(totals.totalHUF, totals.subtotalHUF + 1190);
});

test("computeOrderTotals rejects insufficient stock", () => {
  const products = new Map([["p1", { priceHUF: 1000, stock: 1 }]]);
  assert.throws(
    () =>
      computeOrderTotals({
        lines: [{ productId: "p1", quantity: 3 }],
        products,
        shippingMethod: "pickup",
      }),
    /raktáron/
  );
});

test("sanitizeText strips control characters", () => {
  assert.equal(sanitizeText("hello\u0000world", 20), "helloworld");
});

test("resolveStripeShippingPriceId maps foxpost_courier to courier env with home fallback", () => {
  const prevCourier = process.env.STRIPE_PRICE_SHIPPING_FOXPOST_COURIER;
  const prevHome = process.env.STRIPE_PRICE_SHIPPING_FOXPOST_HOME;
  const prevFallback = process.env.STRIPE_PRICE_SHIPPING_ID;

  delete process.env.STRIPE_PRICE_SHIPPING_FOXPOST_COURIER;
  process.env.STRIPE_PRICE_SHIPPING_FOXPOST_HOME = "price_home_test";
  delete process.env.STRIPE_PRICE_SHIPPING_ID;

  assert.equal(resolveStripeShippingPriceId("foxpost_courier"), "price_home_test");

  process.env.STRIPE_PRICE_SHIPPING_FOXPOST_COURIER = "price_courier_test";
  assert.equal(resolveStripeShippingPriceId("foxpost_courier"), "price_courier_test");

  if (prevCourier === undefined) delete process.env.STRIPE_PRICE_SHIPPING_FOXPOST_COURIER;
  else process.env.STRIPE_PRICE_SHIPPING_FOXPOST_COURIER = prevCourier;
  if (prevHome === undefined) delete process.env.STRIPE_PRICE_SHIPPING_FOXPOST_HOME;
  else process.env.STRIPE_PRICE_SHIPPING_FOXPOST_HOME = prevHome;
  if (prevFallback === undefined) delete process.env.STRIPE_PRICE_SHIPPING_ID;
  else process.env.STRIPE_PRICE_SHIPPING_ID = prevFallback;
});

test("resolveFoxpostFulfillmentMethod maps courier to home delivery", () => {
  assert.equal(resolveFoxpostFulfillmentMethod("foxpost_courier"), "foxpost_home");
  assert.equal(resolveFoxpostFulfillmentMethod("foxpost_locker"), "foxpost_locker");
  assert.equal(resolveFoxpostFulfillmentMethod("gls_courier"), null);
});

test("computeOrderTotals charges home delivery price for foxpost_courier", () => {
  const products = new Map([["p1", { priceHUF: 1000, stock: 5 }]]);
  const totals = computeOrderTotals({
    lines: [{ productId: "p1", quantity: 1 }],
    products,
    shippingMethod: "foxpost_courier",
  });
  assert.equal(totals.shippingHUF, 2500);
});

test("computeOrderTotals makes home delivery free at 15000+ subtotal", () => {
  const products = new Map([["p1", { priceHUF: 15000, stock: 5 }]]);
  const totals = computeOrderTotals({
    lines: [{ productId: "p1", quantity: 1 }],
    products,
    shippingMethod: "foxpost_courier",
  });
  assert.equal(totals.shippingHUF, 0);
});

test("computeOrderTotals keeps locker fee above free-home threshold", () => {
  const products = new Map([["p1", { priceHUF: 15000, stock: 5 }]]);
  const totals = computeOrderTotals({
    lines: [{ productId: "p1", quantity: 1 }],
    products,
    shippingMethod: "foxpost_locker",
  });
  assert.equal(totals.shippingHUF, 1190);
});
