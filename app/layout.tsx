// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/header/header";
import Footer from "./components/footer/footer";
import { ReduxProvider } from "./store/provider";
import { ToastProvider } from "./components/toast/ToastProvider";
import CartPersistence from "./components/cartPersistence";
import CookieConsent from "./components/cookieConsent/CookieConsent";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: "Sophie Garone Author page",
  description: "Fantasy Romantic Author page",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body>
        <ReduxProvider>
          <div
            id="toast-root"
            className="toast_toastToot__mg6h4"
            role="region"
            aria-label="Értesítések"
            aria-live="polite"
          />
          <ToastProvider>
            <CartPersistence />
            <Header />
            {children}
            <Footer />
            <CookieConsent />
          </ToastProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
