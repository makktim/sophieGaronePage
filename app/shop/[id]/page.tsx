import { notFound } from "next/navigation";
import ProductClient from "./ProductClient";
import { getPrisma, hasDb } from "@/app/lib/prisma";
import {
  getShopProductDetail,
  isShopProductListed,
  mapApiProductToDetail,
} from "@/app/lib/shopProduct";
import { resolveProductId } from "@/app/lib/productCatalog";

type RouteParams = { id: string };

export default async function ProductPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { id } = await params;
  const resolvedId = resolveProductId(id);

  if (!isShopProductListed(resolvedId)) {
    return notFound();
  }

  if (!hasDb) {
    const fallback = getShopProductDetail(resolvedId);
    if (!fallback) return notFound();
    return <ProductClient product={fallback} />;
  }

  const prisma = getPrisma();
  const product = await prisma.product.findUnique({ where: { id: resolvedId } });

  if (!product) {
    const fallback = getShopProductDetail(resolvedId);
    if (!fallback) return notFound();
    return <ProductClient product={fallback} />;
  }

  return (
    <ProductClient
      product={mapApiProductToDetail({
        id: product.id,
        title: product.title,
        priceHUF: product.priceHUF,
        stock: product.stock,
      })}
    />
  );
}
