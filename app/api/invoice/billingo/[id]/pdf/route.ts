// app/api/invoice/billingo/[id]/pdf/route.ts
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const r = await fetch(
    `${process.env.BILLINGO_API_URL}/invoices/${params.id}/pdf`,
    {
      headers: { "X-API-KEY": process.env.BILLINGO_API_KEY! },
    }
  );
  if (!r.ok)
    return NextResponse.json({ error: "Download failed" }, { status: 400 });
  const blob = await r.arrayBuffer();
  return new NextResponse(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${params.id}.pdf"`,
    },
  });
}
