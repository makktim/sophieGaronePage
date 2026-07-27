export const PRODUCT_ID_ALIASES: Record<string, string> = {
  "book-ego-es-fold-kozott": "036e509c-9202-46ca-9e30-a0239324dfba",
  "az-eg-es-fold-kozott": "036e509c-9202-46ca-9e30-a0239324dfba",
  "a-felhok-felett": "0e2f498c-25f3-4538-bb3c-f0cd6183277c",
};

export function resolveProductId(id: string | undefined | null): string {
  if (!id) return "";
  const normalized = String(id).trim();
  return PRODUCT_ID_ALIASES[normalized] ?? normalized;
}
