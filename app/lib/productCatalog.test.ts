import test from "node:test";
import assert from "node:assert/strict";
import { resolveProductId } from "./productCatalog";

test("resolves the legacy shop slug to the current database product ID", () => {
  assert.equal(
    resolveProductId("book-ego-es-fold-kozott"),
    "036e509c-9202-46ca-9e30-a0239324dfba"
  );
});

test("preserves already-normalized database product IDs", () => {
  const id = "036e509c-9202-46ca-9e30-a0239324dfba";
  assert.equal(resolveProductId(id), id);
});
