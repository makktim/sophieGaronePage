"use client";

import ProductDetailView from "../ProductDetailView";
import type { ShopProductDetail } from "@/app/lib/shopProduct";

export default function ProductClient({
  product,
}: {
  product: ShopProductDetail;
}) {
  return <ProductDetailView product={product} variant="page" />;
}
