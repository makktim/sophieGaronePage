import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCTS = [
  {
    id: "036e509c-9202-46ca-9e30-a0239324dfba",
    title: "Ég és föld között",
    priceHUF: 6299,
    stock: 500,
    stripePriceId: "price_1SGJ4bD4fxQIe96D2QuZhxhD",
  },
  {
    id: "0e2f498c-25f3-4538-bb3c-f0cd6183277c",
    title: "A felhők felett",
    priceHUF: 6299,
    stock: 500,
    stripePriceId: "price_1TTfEgD4fxQIe96DW37V55Ln",
  },
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000001",
    title: "Ég és föld között – Olvasói Élménycsomag (Tollas könyvjelzővel)",
    priceHUF: 5700,
    stock: 100,
    stripePriceId: "price_1UKlg5RVMPQ6s4fBTYbGg4kV",
  },
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000002",
    title: "Ég és föld között – Hangulatcsomag (Illatgyertyával)",
    priceHUF: 5700,
    stock: 100,
    stripePriceId: "price_1UKlh5RVMPQ6s4fBrNXj1LcN",
  },
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000003",
    title: "A felhők felett – Exkluzív Csomag (Könyvjelzővel)",
    priceHUF: 5700,
    stock: 100,
    stripePriceId: "price_1UKlhvRVMPQ6s4fBD9dc0jNX",
  },
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000004",
    title: "A felhők felett – Bűnös Szenvedély Csomag",
    priceHUF: 5700,
    stock: 100,
    stripePriceId: "price_1UKliURVMPQ6s4fBYgps4JIF",
  },
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000005",
    title: "A felhők felett – Romantikus Esték Csomag",
    priceHUF: 5700,
    stock: 100,
    stripePriceId: "price_1UKljERVMPQ6s4fBKesG68y3",
  },
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000006",
    title: "Sophie Garone Duó – Prémium Olvasói Csomag",
    priceHUF: 11500,
    stock: 100,
    stripePriceId: "price_1Txw4dRVMPQ6s4fBoRpQEDju",
  },
  {
    id: "a1b2c3d4-e5f6-7890-ab12-000000000007",
    title: "Sophie Garone Teljes Duó – Érzéki Fantasy Csomag",
    priceHUF: 11500,
    stock: 100,
    stripePriceId: "price_1Txw5YRVMPQ6s4fB9UT3292v",
  },
] as const;

async function main() {
  for (const product of PRODUCTS) {
    const data = {
      title: product.title,
      priceHUF: product.priceHUF,
      stock: product.stock,
      stripePriceId: product.stripePriceId || null,
    };
    await prisma.product.upsert({
      where: { id: product.id },
      create: { id: product.id, ...data },
      update: {
        title: data.title,
        priceHUF: data.priceHUF,
        stripePriceId: data.stripePriceId,
      },
    });
  }
  console.log(`Seeded ${PRODUCTS.length} products`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
