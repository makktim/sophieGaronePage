// app/product/[id]/page.tsx
import { notFound } from "next/navigation";

import ProductClient from "./ProductClient";
import { prisma } from "@/app/lib/prisma";

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  });
  if (!product) return notFound();

  const mapped = {
    id: product.id,
    title: product.title,
    price: product.priceHUF,
    currency: "HUF",
    imageSrc: "/", // ha lesz kép meződ, ide tedd
    description:
      "A megrendelt könyvet a megjelenés dátuma után tudjuk átadni a futárszolgálatnak. Minden példányt dedikálunk és különleges könyvjelzőt adunk hozzá ajándékba.",
    meta: {
      type: "Romantikus - akció fantasy",
      language: "magyar",
      pages: 514,
      isbn: "9789636831332",
    },
    inStock: (product.stock ?? 0) > 0,
    deliveryNote: "A megjelenés után 2–4 munkanap",
    // deliveryNote: "2–4 munkanap",
  };

  return <ProductClient product={mapped} />;
}
