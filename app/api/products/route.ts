import { NextResponse } from "next/server";
import { getPrisma, hasDb } from "@/app/lib/prisma";
import {
  filterListedShopProducts,
  sortShopProducts,
} from "@/app/lib/shopProduct";

export async function GET() {
  const products = hasDb
    ? sortShopProducts(
        filterListedShopProducts(await getPrisma().product.findMany())
      )
    : [];
  return NextResponse.json({ products });
}
