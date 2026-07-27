export function isSuccessfulCheckoutEvent(eventType: string): boolean {
  return [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "payment_intent.succeeded",
  ].includes(eventType);
}
