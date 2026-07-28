import { resolveProductId } from "@/app/lib/productCatalog";

export type ProductMeta = {
  type?: string;
  language?: string;
  pages?: number;
  isbn?: string;
  size?: string;
  [k: string]: unknown;
};

export type ShopProductDetail = {
  id: string;
  title: string;
  author?: string;
  price: number;
  originalPrice?: number;
  currency: "HUF";
  imageSrc: string;
  description: string;
  /** Cursive line under the lead (e.g. "Harcos. Őrangyal.") — editable per product. */
  tagline: string;
  longDescription: string;
  /** Extra paragraph after the description — package contents list. */
  contents?: string;
  meta: ProductMeta;
  inStock: boolean;
  statusLabel?: string;
  onSale?: boolean;
  /** Image badge text (e.g. "AKCIÓ!" or "Előrendelhető") */
  badgeLabel?: string;
  deliveryNote: string;
};

const DEFAULT_DESCRIPTION =
  "A megrendelt könyvet a megjelenés dátuma után tudjuk átadni a futárszolgálatnak. Minden példányt dedikálunk és különleges könyvjelzőt adunk hozzá ajándékba.";


const DEFAULT_LONG_DESCRIPTION =
  "Ez a két szó volt Kyra mindene évszázadokon át. Egészen addig, amíg védence, Matt megmentéséért meg nem szegte a Menny legfőbb törvényét. Büntetésül emberként kell szembenéznie a démonokkal, akik mindenáron meg akarják ölni a férfit. Miközben versenyt futnak az idővel, hogy feltárják Matt kilétének titkát, egyre közelebb kerülnek egymáshoz, és a lány újra felfedezi az érzéseket, amelyeket már rég száműzött magából. De vajon utat engedhet az érzelmeinek Kyra? És ha rájönnek az igazságra, visszakaphatja a szárnyait? Sophie Garone szerzőpáros regénye egy érzelmekkel teli, akciódús, romantikus fantasy, amely a halandóság törékenységét, az önfeláldozás erejét és a sors határait feszegeti, miközben az emberi lét legfontosabb kérdéseit is górcső alá veszi.";

const DEFAULT_META: ProductMeta = {
  type: "Romantikus - akció fantasy",
  language: "magyar",
  pages: 514,
  isbn: "9789636831332",
};

const PACKAGE_META: ProductMeta = {
  type: "Ajándékcsomag",
  language: "magyar",
};

const PACKAGE_DELIVERY = "A megjelenés után 2–4 munkanap";

/**
 * Shop megjelenítési sorrend (felülről lefelé / balról jobbra).
 * A lista átrendezésével változik a webshop sorrendje.
 * Ismeretlen ID-k a lista végére kerülnek.
 */
export const SHOP_PRODUCT_DISPLAY_ORDER: string[] = [
  "a1b2c3d4-e5f6-7890-ab12-000000000006", // Sophie Garone Duó – Prémium Olvasói Csomag
  "a1b2c3d4-e5f6-7890-ab12-000000000007", // Sophie Garone Teljes Duó – Érzéki Fantasy Csomag
  "a1b2c3d4-e5f6-7890-ab12-000000000004", // A felhők felett – Bűnös Szenvedély Csomag
  "a1b2c3d4-e5f6-7890-ab12-000000000001", // Ég és föld között – Olvasói Élménycsomag
  "a1b2c3d4-e5f6-7890-ab12-000000000002", // Ég és föld között – Hangulatcsomag
  "a1b2c3d4-e5f6-7890-ab12-000000000003", // A felhők felett – Exkluzív Csomag
  "a1b2c3d4-e5f6-7890-ab12-000000000005", // A felhők felett – Romantikus Esték Csomag
];

/** Standalone books temporarily removed from the shop (packages remain). */
export const HIDDEN_FROM_SHOP_PRODUCT_IDS = new Set<string>([
  "0e2f498c-25f3-4538-bb3c-f0cd6183277c", // A felhők felett (5669 Ft)
  "036e509c-9202-46ca-9e30-a0239324dfba", // Ég és föld között (5669 Ft)
]);

export function isShopProductListed(id: string | undefined | null): boolean {
  if (!id) return false;
  return !HIDDEN_FROM_SHOP_PRODUCT_IDS.has(resolveProductId(id));
}

export function filterListedShopProducts<T extends { id: string }>(
  products: T[]
): T[] {
  return products.filter((product) => isShopProductListed(product.id));
}

export function sortShopProducts<T extends { id: string }>(products: T[]): T[] {
  const rank = new Map(
    SHOP_PRODUCT_DISPLAY_ORDER.map((id, index) => [id, index])
  );
  return [...products].sort((a, b) => {
    const aRank = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bRank = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return aRank - bRank;
  });
}

/** Products that include "A felhők felett" use a pre-order badge instead of sale. */
function includesFelhokFelettBook(title: string): boolean {
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return (
    normalized.includes("felhok felett") ||
    normalized.includes("duo")
  );
}

export function getProductBadgeLabel(
  product: Pick<ShopProductDetail, "title" | "onSale" | "badgeLabel">
): string | undefined {
  if (product.badgeLabel) return product.badgeLabel;
  if (includesFelhokFelettBook(product.title || "")) {
    return "Előrendelhető";
  }
  if (product.onSale) return "AKCIÓ!";
  return undefined;
}

const PRODUCT_OVERRIDES: Record<string, Partial<ShopProductDetail>> = {
  "0e2f498c-25f3-4538-bb3c-f0cd6183277c": {
    author: "Sophie Garone",
    title: "A felhők felett",
    description:
      "A könyv a regénybeli világot és a karakterek közötti kapcsolatot mutatja be.",
      tagline: "Szövetség. Háború.",
    onSale: true,
    badgeLabel: "Előrendelhető",
    imageSrc: "/assets/shop/ff.png",
    originalPrice: 6299,
    price: 5669,
  },
  "a1b2c3d4-e5f6-7890-ab12-000000000006": {
    author: "Sophie Garone",
    title: "Sophie Garone Duó – Prémium Olvasói Csomag",
    description:
      "Mindkét Sophie Garone regény egy prémium olvasói csomagban – a teljes duó egyben.",
    longDescription:
      "A Sophie Garone Duó Prémium Olvasói Csomag mindkét kötetet tartalmazza: az Ég és föld között és A felhők felett regényeket. A teljes világ egy helyen.",
    contents: "A csomag tartalma:\n• 1db Ég és Föld között könyv\n• 1db A felhők felett könyv\n• 1db a könyv hangulatát idéző illatgyertya\n• 1db tollas könyvjelző",
    meta: PACKAGE_META,
    deliveryNote: PACKAGE_DELIVERY,
    imageSrc: "/assets/shop/duo2.png",
    badgeLabel: "Előrendelhető",
    price: 11500,
  },
  "a1b2c3d4-e5f6-7890-ab12-000000000007": {
    author: "Sophie Garone",
    title: "Sophie Garone Teljes Duó – Érzéki Fantasy Csomag",
    description:
      "A Sophie Garone Teljes Duó Érzéki Fantasy Csomag mindkét regényt és a hozzájuk tartozó különleges kiegészítőket tartalmazza.",
      longDescription:
      "A Sophie Garone Duó Prémium Olvasói Csomag mindkét kötetet tartalmazza: az Ég és föld között és A felhők felett regényeket. A teljes világ egy helyen.",
    contents: "A csomag tartalma:\n• 1db Ég és Föld között könyv\n• 1db A felhők felett könyv\n• 1db bilincs választható színben (piros, fekete, rózsaszín, lila)\n• 1db tollas könyvjelző",
    meta: PACKAGE_META,
    deliveryNote: PACKAGE_DELIVERY,
    badgeLabel: "Előrendelhető",
    imageSrc: "/assets/shop/duo1.png",
    price: 11500,
  },
  "036e509c-9202-46ca-9e30-a0239324dfba": {
    author: "Sophie Garone",
    title: "Ég és föld között",
    description:
      "Romantikus fantasy regény, amely a sors, az önfeláldozás és a szerelem határait feszegeti.",
    tagline: "Harcos. Őrangyal.",
    onSale: true,
    badgeLabel: "AKCIÓ!",
    originalPrice: 6299,
    price: 5669,
  },
  "a1b2c3d4-e5f6-7890-ab12-000000000004": {
    author: "Sophie Garone",
    title: "A felhők felett – Bűnös Szenvedély Csomag",
    description:
      "A felhők felett Bűnös Szenvedély Csomag a regény köré épített ajándékcsomag, amely a történet szenvedélyes hangulatát hozza el.",
      tagline: "Szövetség. Háború.",
    longDescription: "Kyra végre megtalálta azt, amiért érdemes élni, és meglelte társát, Matt, azaz Solan, az isteni örökös oldalán. Ám a sors nem ad nekik időt a megnyugvásra, mert újabb, könyörtelen próbatétel elé állítja őket.\n Kyra, Matt és maroknyi, elszánt csapatuk harcba indul a démonok ellen, hogy megtisztítsák a Földet. Arra azonban sem számítanak, hogy egy  régóta tervezett háború kellős közepébe csöppennek. \nMiközben a világ lángba borul körülöttük, Kyra egy újabb, minden eddiginél nehezebb igazsággal kénytelen szembenézni: nem elég felépíteni egy új életet, meg is kell tudni védeni azt. \nDe mi marad belőlük, ha a csaták tüzében végül már magukra sem ismernek? \nA felhők felett az Ég és Föld között feszült, sötét és érzelmekkel teli folytatása. \nEgy történet a hűségről, az önfeláldozásról és egy szerelemről, amelynek a saját sötétségével is meg kell küzdenie. \nA legnagyobb csatát az ellen vívjuk, amivé válnunk kell egy háborúban a túlélésért",
    contents: "A csomag tartalma:\n• 1db A felhők felett könyv\n• 1db bilincs választható színben (piros, fekete, rózsaszín, lila)",
    meta: PACKAGE_META,
    deliveryNote: PACKAGE_DELIVERY,
    badgeLabel: "Előrendelhető",
    imageSrc: "/assets/shop/konyvcsomag1.png",
    price: 6000,
  },
  "a1b2c3d4-e5f6-7890-ab12-000000000001": {
    author: "Sophie Garone",
    title: "Ég és föld között – Olvasói Élménycsomag",
    description:
      "Ég és föld között olvasói élménycsomag tollas könyvjelzővel – tökéletes ajándék a romantikus fantasy rajongóinak.",
    tagline: "Harcos. Őrangyal.",
    contents: "A csomag tartalma:\n• 1db Ég és föld között könyv\n• 1 db tollas könyvjelző",
    meta: PACKAGE_META,
    deliveryNote: PACKAGE_DELIVERY,
    onSale: true,
    badgeLabel: "AKCIÓ!",
    imageSrc: "/assets/shop/konyvcsomag_gy.png",
    price: 6000,
  },
  "a1b2c3d4-e5f6-7890-ab12-000000000002": {
    author: "Sophie Garone",
    title: "Ég és föld között – Hangulatcsomag",
    description:
      "Az Ég és föld között Hangulatcsomag a könyvet és egy illatgyertyát tartalmazza. Alkoss hangulatot az olvasáshoz: gyújtsd meg a gyertyát, és merülj el Kyra és Matt történetében.",
    tagline: "Harcos. Őrangyal.",
    contents: "A csomag tartalma:\n• 1db Ég és föld között könyv\n• 1db a könyv hangulatát idéző illatgyertya",
    meta: PACKAGE_META,
    deliveryNote: PACKAGE_DELIVERY,
    onSale: true,
    badgeLabel: "AKCIÓ!",
    imageSrc: "/assets/shop/efk_gyertya.png",
    price: 6000,
  },
  "a1b2c3d4-e5f6-7890-ab12-000000000003": {
    author: "Sophie Garone",
    title: "A felhők felett – Exkluzív Csomag",
    description:
      "A felhők felett Exkluzív Csomag a regényt és egy különleges könyvjelzőt tartalmazza.",
      tagline: "Szövetség. Háború.",
      longDescription: "Kyra végre megtalálta azt, amiért érdemes élni, és meglelte társát, Matt, azaz Solan, az isteni örökös oldalán. Ám a sors nem ad nekik időt a megnyugvásra, mert újabb, könyörtelen próbatétel elé állítja őket.\n Kyra, Matt és maroknyi, elszánt csapatuk harcba indul a démonok ellen, hogy megtisztítsák a Földet. Arra azonban sem számítanak, hogy egy  régóta tervezett háború kellős közepébe csöppennek. \nMiközben a világ lángba borul körülöttük, Kyra egy újabb, minden eddiginél nehezebb igazsággal kénytelen szembenézni: nem elég felépíteni egy új életet, meg is kell tudni védeni azt. \nDe mi marad belőlük, ha a csaták tüzében végül már magukra sem ismernek? \nA felhők felett az Ég és Föld között feszült, sötét és érzelmekkel teli folytatása. \nEgy történet a hűségről, az önfeláldozásról és egy szerelemről, amelynek a saját sötétségével is meg kell küzdenie. \nA legnagyobb csatát az ellen vívjuk, amivé válnunk kell egy háborúban a túlélésért",
    contents: "A csomag tartalma:\n• 1db A felhők felett könyv\n• 1 db tollas könyvjelző",
    meta: PACKAGE_META,
    deliveryNote: PACKAGE_DELIVERY,
    badgeLabel: "Előrendelhető",
    imageSrc: "/assets/shop/konyvcsomag4.png",
    price: 6000,
  },
  "a1b2c3d4-e5f6-7890-ab12-000000000005": {
    author: "Sophie Garone",
    title: "A felhők felett – Romantikus Esték Csomag",
    description:
      "A felhők felett Romantikus Esték Csomag a regényt és a romantikus hangulathoz illő kiegészítőket tartalmazza. Ideális pároknak vagy bárkinek, aki egy különleges olvasós estét szeretne.",
      tagline: "Szövetség. Háború.",
      longDescription: "Kyra végre megtalálta azt, amiért érdemes élni, és meglelte társát, Matt, azaz Solan, az isteni örökös oldalán. Ám a sors nem ad nekik időt a megnyugvásra, mert újabb, könyörtelen próbatétel elé állítja őket.\n Kyra, Matt és maroknyi, elszánt csapatuk harcba indul a démonok ellen, hogy megtisztítsák a Földet. Arra azonban sem számítanak, hogy egy  régóta tervezett háború kellős közepébe csöppennek. \nMiközben a világ lángba borul körülöttük, Kyra egy újabb, minden eddiginél nehezebb igazsággal kénytelen szembenézni: nem elég felépíteni egy új életet, meg is kell tudni védeni azt. \nDe mi marad belőlük, ha a csaták tüzében végül már magukra sem ismernek? \nA felhők felett az Ég és Föld között feszült, sötét és érzelmekkel teli folytatása. \nEgy történet a hűségről, az önfeláldozásról és egy szerelemről, amelynek a saját sötétségével is meg kell küzdenie. \nA legnagyobb csatát az ellen vívjuk, amivé válnunk kell egy háborúban a túlélésért",
    contents: "A csomag tartalma:\n• 1db A felhők felett könyv\n• 1db a könyv hangulatát idéző illatgyertya",
    meta: PACKAGE_META,
    deliveryNote: PACKAGE_DELIVERY,
    badgeLabel: "Előrendelhető",
    imageSrc: "/assets/shop/ff_gyertya.png",
    price: 6000,
  },
};

type ApiProduct = {
  id?: string;
  title?: string;
  priceHUF?: number | string;
  description?: string;
  stock?: number | string;
};

export function mapApiProductToDetail(product: ApiProduct): ShopProductDetail {
  const id = resolveProductId(product.id);
  const overrides = PRODUCT_OVERRIDES[id] ?? {};
  const stock = Number(product.stock ?? 0);
  const price = Number(overrides.price ?? product.priceHUF ?? 0);

  return {
    id,
    title: overrides.title ?? product.title ?? "Ismeretlen termék",
    author: overrides.author ?? "Sophie Garone",
    price,
    originalPrice: overrides.originalPrice,
    currency: "HUF",
    imageSrc: overrides.imageSrc ?? "/",
    description: overrides.description ?? product.description ?? DEFAULT_DESCRIPTION,
    tagline: overrides.tagline ?? "",
    longDescription: overrides.longDescription ?? DEFAULT_LONG_DESCRIPTION,
    contents: overrides.contents,
    meta: overrides.meta ?? DEFAULT_META,
    inStock: stock > 0,
    statusLabel:
      overrides.statusLabel ?? (stock > 0 ? undefined : "ELFOGYOTT"),
    onSale: overrides.onSale ?? false,
    badgeLabel: overrides.badgeLabel,
    deliveryNote: overrides.deliveryNote ?? "A megjelenés után 2–4 munkanap",
  };
}

const FALLBACK_API_PRODUCTS: ApiProduct[] = [
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000001",
    title: "Ég és föld között – Olvasói Élménycsomag",
    priceHUF: 6000,
    stock: 100,
  },
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000002",
    title: "Ég és föld között – Hangulatcsomag",
    priceHUF: 6000,
    stock: 100,
  },
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000003",
    title: "A felhők felett – Exkluzív Csomag",
    priceHUF: 6000,
    stock: 100,
  },
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000004",
    title: "A felhők felett – Bűnös Szenvedély Csomag",
    priceHUF: 6000,
    stock: 100,
  },
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000005",
    title: "A felhők felett – Romantikus Esték Csomag",
    priceHUF: 6000,
    stock: 100,
  },
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000006",
    title: "Sophie Garone Duó – Prémium Olvasói Csomag",
    priceHUF: 11500,
    stock: 100,
  },
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000007",
    title: "Sophie Garone Teljes Duó – Érzéki Fantasy Csomag",
    priceHUF: 11500,
    stock: 100,
  },
];

export const FALLBACK_SHOP_PRODUCTS: ShopProductDetail[] = sortShopProducts(
  filterListedShopProducts(FALLBACK_API_PRODUCTS.map(mapApiProductToDetail))
);

export function formatProductCardTitle(product: ShopProductDetail): string {
  const title = product.title ?? "";
  const author =
    product.author &&
    !title.toLowerCase().startsWith(product.author.toLowerCase())
      ? product.author
      : undefined;
  const parts = [author, title, product.statusLabel].filter(Boolean);
  return parts.join(" – ");
}

export function formatPrice(
  amount: number,
  currency: string = "HUF"
): string {
  try {
    return new Intl.NumberFormat("hu-HU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`.trim();
  }
}

export function getShopProductDetail(id: string): ShopProductDetail | undefined {
  const resolvedId = resolveProductId(id);
  return FALLBACK_SHOP_PRODUCTS.find((product) => product.id === resolvedId);
}

const DEFAULT_PRODUCT_IMAGE = "/assets/extra.png";

/** Resolves a usable shop image path, falling back to the default cover. */
export function resolveProductImageSrc(imageSrc?: string | null): string {
  if (!imageSrc || imageSrc === "/" || imageSrc === "/placeholder.png") {
    return DEFAULT_PRODUCT_IMAGE;
  }
  return imageSrc;
}
