import { prisma } from "@/app/lib/prisma";

async function main() {
  const count = await prisma.product.count();
  if (count === 0) {
    await prisma.product.create({
      data: { title: "Bleeding Sky (könyv)", priceHUF: 6500, stock: 100 },
    });
  }
  console.log("Seed done");
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
