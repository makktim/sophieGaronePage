import { renderCustomerEmail, OrderEmailInput, Brand } from "./orderCustomer";

export function renderMerchantEmail(order: OrderEmailInput, brand: Brand) {
  // Egyszerű változat: ugyanaz a layout, rövidebb fejléccel + "Új rendelés"
  const cust = renderCustomerEmail(order, brand);
  const subject = `Új rendelés – #${order.id}`;
  const html = cust.html.replace(
    "Köszönjük a rendelésed!",
    "Új rendelés érkezett"
  );
  const text = cust.text.replace("Rendelés visszaigazolás", "Új rendelés");
  return { subject, html, text };
}
