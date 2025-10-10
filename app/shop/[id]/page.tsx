/* // app/product/[id]/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound } from "next/navigation";
import ProductClient from "./ProductClient";
import { getPrisma, hasDb } from "@/app/lib/prisma";

type MaybePromise<T> = T | Promise<T>;
type RouteParams = { id: string };

export default async function ProductPage({
  params,
}: {
  params: MaybePromise<RouteParams>;
}) {
  const { id } = await Promise.resolve(params);

  // Ha nincs DB, itt döntsd el: notFound vagy mock
  if (!hasDb) {
    return notFound();
    // vagy:
    // const mapped = { ...mock };
    // return <ProductClient product={mapped} />;
  }

  const prisma = getPrisma();
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) return notFound();

  const mapped = {
    id: product.id,
    title: product.title,
    price: product.priceHUF,
    currency: "HUF",
    imageSrc: "/",
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
  };

  return <ProductClient product={mapped} />;
}
 */

export default async function ProductPage({}) {

  return null;
}