import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { CookieBanner } from "@/components/cookie-banner";
import { Analytics } from "@/components/analytics";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "WaSend — WhatsApp Business Otomasyonu",
    template: "%s · WaSend",
  },
  description:
    "İşletmeniz için WhatsApp otomatik cevap, randevu hatırlatma, toplu mesaj, AI destekli müşteri hizmetleri ve analitik.",
  keywords: [
    "whatsapp business",
    "otomatik mesaj",
    "randevu hatırlatma",
    "toplu mesaj",
    "chatbot",
    "müşteri hizmetleri",
  ],
  authors: [{ name: "WaSend" }],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://wasend.tech",
    title: "WaSend — WhatsApp Business Otomasyonu",
    description:
      "İşletmeniz için otomatik WhatsApp müşteri hizmetleri, randevu hatırlatma, toplu mesaj ve AI chatbot.",
    siteName: "WaSend",
  },
  twitter: {
    card: "summary_large_image",
    title: "WaSend — WhatsApp Otomasyon",
    description: "İşletmeler için WhatsApp otomasyonu",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  return (
    <html lang="tr">
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
        <CookieBanner />
        <Analytics />
        {recaptchaKey && (
          <Script
            src={`https://www.google.com/recaptcha/api.js?render=${recaptchaKey}`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
