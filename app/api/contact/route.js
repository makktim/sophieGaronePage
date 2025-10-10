import nodemailer from "nodemailer";

export async function POST(req) {
  const { name, email, message } = await req.json();

  console.log("GMAIL_USER:", process.env.NEXT_PUBLIC_GMAIL_USER);

  if (!name || !email) {
    return res.status(400).json({ message: "Minden mezőt ki kell tölteni." });
  }

  try {
    // SMTP kapcsolat Nodemailerrel
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NEXT_PUBLIC_GMAIL_USER, // Gmail-fiók
        pass: process.env.NEXT_PUBLIC_GMAIL_PASS, // Gmail "App Password" (nem a normál jelszó!)
      },
    });

    // Email adatok
    const mailOptions = {
      from: email,
      to: process.env.NEXT_PUBLIC_GMAIL_USER, // Ez a te email címed
      subject: `Kapcsolatfelvétel: ${name}`,
      text: message,
    };

    // Email elküldése
    await transporter.sendMail(mailOptions);

    return new Response(
      JSON.stringify({ message: "Az üzenetet sikeresen elküldtük!" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Hiba az email küldése során:", error);
    return new Response(
      JSON.stringify({ message: "Hiba történt az üzenet elküldése során" }),
      {
        status: 500,
      }
    );
  }
}

// Optional: Add a GET handler if needed
export async function GET() {
  return new Response(JSON.stringify({ message: "contact from GET" }), {
    status: 200,
  });
}
