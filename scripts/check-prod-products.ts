import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, title: true, priceHUF: true, stripePriceId: true },
    orderBy: { title: "asc" },
  });
  for (const p of products) {
    console.log(`${p.id}\t${p.title}\t${p.priceHUF}\t${p.stripePriceId}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
