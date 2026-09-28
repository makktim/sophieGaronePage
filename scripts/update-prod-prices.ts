import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UPDATES = [
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000001",
    priceHUF: 5700,
    stripePriceId: "price_1UKlg5RVMPQ6s4fBTYbGg4kV",
  },
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000002",
    priceHUF: 5700,
    stripePriceId: "price_1UKlh5RVMPQ6s4fBrNXj1LcN",
  },
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000003",
    priceHUF: 5700,
    stripePriceId: "price_1UKlhvRVMPQ6s4fBD9dc0jNX",
  },
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000004",
    priceHUF: 5700,
    stripePriceId: "price_1UKliURVMPQ6s4fBYgps4JIF",
  },
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000005",
    priceHUF: 5700,
    stripePriceId: "price_1UKljERVMPQ6s4fBKesG68y3",
  },
];

async function main() {
  for (const u of UPDATES) {
    try {
      const before = await prisma.product.findUnique({ where: { id: u.id }, select: { id: true, title: true, priceHUF: true, stripePriceId: true } });
      console.log('Before:', before);
      const updated = await prisma.product.update({
        where: { id: u.id },
        data: { priceHUF: u.priceHUF, stripePriceId: u.stripePriceId },
        select: { id: true, title: true, priceHUF: true, stripePriceId: true },
      });
      console.log('Updated:', updated);
    } catch (err) {
      console.error(`Failed to update ${u.id}:`, err instanceof Error ? err.message : err);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
