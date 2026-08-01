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
  title: "Sophie Garone",
  description:
    "Sophie Garone romantikus fantasy világ – könyvek, csomagok és hivatalos szerzői oldal.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "hu_HU",
    siteName: "Sophie Garone",
    title: "Sophie Garone",
    description:
      "Sophie Garone romantikus fantasy világ – könyvek, csomagok és hivatalos szerzői oldal.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sophie Garone – Ég és föld között & A felhők felett",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sophie Garone",
    description:
      "Sophie Garone romantikus fantasy világ – könyvek, csomagok és hivatalos szerzői oldal.",
    images: ["/og-image.png"],
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
