import mailchimp from "@mailchimp/mailchimp_marketing";

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: "us16",
});

export async function POST(req) {
  try {
    const { email } = await req.json();

    console.log(email);

    const response = await mailchimp.lists.addListMember("1104f31801", {
      email_address: email,
      status: "subscribed",
    });

    return new Response(JSON.stringify({ success: true, data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to subscribe" }),
      { status: 500 }
    );
  }
}

export async function GET() {
  return new Response(JSON.stringify({ message: "Hello from GET" }), {
    status: 200,
  });
}
