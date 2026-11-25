// Build előtt fut (Vercelen az éles DATABASE_URL-lel).
// Létrehozza a hiányzó termékeket fix ID-val; a meglévőkhöz NEM nyúl
// (ár/készlet módosítás továbbra is a seed / update script feladata).
// Hiba esetén csak figyelmeztet, a buildet nem állítja meg.
import { PrismaClient } from "@prisma/client";

const PRODUCTS = [
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000008",
    title: "Karácsonyi Duó Csomag",
    priceHUF: 9999,
    stock: 100,
    stripePriceId: "price_1Ufhx8RVMPQ6s4fBqRIAyVlS",
  },
];

if (!process.env.DATABASE_URL) {
  console.log("[ensure-products] Nincs DATABASE_URL, kihagyva.");
  process.exit(0);
}

const prisma = new PrismaClient();

try {
  for (const p of PRODUCTS) {
    const existing = await prisma.product.findUnique({
      where: { id: p.id },
      select: { id: true },
    });
    if (existing) {
      console.log(`[ensure-products] Már létezik: ${p.title} (${p.id})`);
      continue;
    }
    await prisma.product.create({ data: p });
    console.log(`[ensure-products] Létrehozva: ${p.title} (${p.id})`);
  }
} catch (err) {
  console.warn("[ensure-products] HIBA, a termék nem jött létre:", err);
} finally {
  await prisma.$disconnect();
}
