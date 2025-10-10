import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // {client, items, paymentMethod, ...}

    const res = await fetch(`${process.env.BILLINGO_API_URL}/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.BILLINGO_API_KEY!,
      },
      body: JSON.stringify({
        // minimál példa – igazítsd a saját folyamataidhoz
        partner_id: body.partner_id, // előbb partner létrehozás/listázás
        block_id: Number(process.env.BILLINGO_BLOCK_ID),
        type: "invoice",
        fulfillment_date: body.fulfillment_date, // "2025-09-24"
        invoice_date: body.invoice_date, // "2025-09-24"
        due_date: body.due_date, // "2025-10-01"
        payment_method: body.payment_method ?? "bankcard",
        currency: body.currency ?? "HUF",
        language: "hu",
        items: body.items, // [{name, unit_price, unit, quantity, vat}]
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: "Billingo error", details: err },
        { status: 400 }
      );
    }

    const invoice = await res.json();
    return NextResponse.json(invoice);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
