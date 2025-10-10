// app/api/foxpost/labels/route.ts
import { NextResponse } from "next/server";
import { foxpostFetch } from "@/app/lib/foxpostClient";

type Body = {
  clFoxIds: string[]; // pl. ["CLFOX..."]
  pageSize?: "A6" | "A7" | "_85X85"; // default: A7
  startPos?: 1 | 2 | 3 | 4 | 5 | 6 | 7; // csak A7-hez
};

export async function POST(req: Request) {
  const { clFoxIds, pageSize = "A7", startPos } = (await req.json()) as Body;

  if (!Array.isArray(clFoxIds) || clFoxIds.length === 0) {
    return NextResponse.json({ error: "clFoxIds kötelező" }, { status: 400 });
  }

  const path = `/label/${pageSize}${startPos ? `?startPos=${startPos}` : ""}`;

  const res = await foxpostFetch(path, {
    method: "POST",
    headers: { Accept: "application/pdf" }, // PDF-et kérünk vissza
    body: JSON.stringify(clFoxIds),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    return NextResponse.json(
      { error: "Foxpost label error", status: res.status, body: txt },
      { status: 502 }
    );
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="foxpost-labels-${Date.now()}.pdf"`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
