
import { NextResponse } from "next/server";
import { getPrisma, hasDb } from "@/app/lib/prisma";

// ha nincs DB, adj fallbacket (pl. üres tömb / mock)
const products = hasDb ? await getPrisma().product.findMany() : [];


export async function GET() {
/*   const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  }); */
  return NextResponse.json({ products });
}
