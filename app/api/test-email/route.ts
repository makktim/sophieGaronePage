// app/api/test-email/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function GET() {
  try {
    const result = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "kasatimi01@gmail.com", // fixen
      subject: "Teszt levél közvetlenül",
      html: "<p>Szia! Ez egy közvetlen teszt a Resend API-val.</p>",
    });
    console.log("Resend response:", result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
