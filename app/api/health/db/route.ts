import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

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
    );
  }
}
