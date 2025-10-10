
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;

  if (!user || !pass) {
    throw new Error("Missing SMTP env: set GMAIL_USER and GMAIL_PASS");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = (await req.json()) as {
      name?: string;
      email?: string;
      message?: string;
    };

    if (!name || !email || !message) {
      return NextResponse.json(
        { message: "Minden mezőt ki kell tölteni." },
        { status: 400 }
      );
    }

    const transporter = getTransport();
    const to = process.env.CONTACT_TO || process.env.GMAIL_USER!;

    await transporter.sendMail({
      from: `"${name}" <${process.env.GMAIL_USER!}>`,
      replyTo: email,
      to,
      subject: `Kapcsolatfelvétel: ${name}`,
      text: message,
      html: `<p><strong>Név:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Üzenet:</strong></p>
             <p>${message.replace(/\n/g, "<br/>")}</p>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Ismeretlen hiba történt.";
    // fejlesztés közben segít:
    console.error("[contact] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
