
/*  import { NextResponse } from "next/server";
import { getPrisma, hasDb } from "@/app/lib/prisma";

// ha nincs DB, adj fallbacket (pl. üres tömb / mock)
export async function GET() {
 try {
    // legegyszerűbb, portábilis check
    const now = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`;
    return NextResponse.json({ ok: true, now: now?.[0]?.now ?? null });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "DB error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    ) 
  }
}*/;

export async function GET() {
  return new Response(JSON.stringify({ message: "Hello from app API!" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

