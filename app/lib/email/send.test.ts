import test from "node:test";
import assert from "node:assert/strict";
import { resolveEmailProvider, resolveEmailFrom } from "./send";

function resetEmailEnv() {
  process.env.EMAIL_PROVIDER = "";
  process.env.SMTP_HOST = "";
  process.env.SMTP_USER = "";
  process.env.SMTP_PASS = "";
  process.env.GMAIL_USER = "";
  process.env.GMAIL_PASS = "";
  process.env.NEXT_PUBLIC_GMAIL_USER = "";
  process.env.NEXT_PUBLIC_GMAIL_PASS = "";
  process.env.RESEND_API_KEY = "";
  process.env.EMAIL_FROM = "";
}

test("uses smtp when gmail credentials are available", () => {
  resetEmailEnv();
  process.env.GMAIL_USER = "orders@example.com";
  process.env.GMAIL_PASS = "secret";

  assert.equal(resolveEmailProvider(), "smtp");
  assert.equal(resolveEmailFrom(), "Sophie Garone <orders@example.com>");
});

test("uses resend when resend api key is present", () => {
  resetEmailEnv();
  process.env.RESEND_API_KEY = "re_test_key";

  assert.equal(resolveEmailProvider(), "resend");
  assert.equal(resolveEmailFrom(), "Sophie Garone <onboarding@resend.dev>");
});
