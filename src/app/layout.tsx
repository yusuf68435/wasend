import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { CookieBanner } from "@/components/cookie-banner";
import { Analytics } from "@/components/analytics";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://wasend.tech"),
  title: {
    default: "WaSend — WhatsApp Business Otomasyonu | 499 ₺'den başlayan paketler",
    template: "%s · WaSend",
  },
  description:
    "Türkiye'nin WhatsApp Business otomasyon platformu. Otomatik cevap, toplu mesaj, randevu hatırlatma, AI chatbot ve analitik — 499 ₺/ay, KDV dahil. 14 gün ücretsiz deneme.",
  keywords: [
    "whatsapp business",
    "whatsapp otomasyon",
    "whatsapp business fiyat",
    "whatsapp business api türkiye",
    "whatsapp toplu mesaj",
    "whatsapp toplu mesaj fiyatları",
    "whatsapp panel yazılımı",
    "whatsapp chatbot",
    "otomatik mesaj",
    "randevu hatırlatma",
    "whatsapp crm",
    "kobi whatsapp",
    "müşteri hizmetleri otomasyonu",
  ],
  authors: [{ name: "WaSend" }],
  alternates: {
    canonical: "https://wasend.tech",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://wasend.tech",
    title: "WaSend — WhatsApp Business Otomasyonu | 499 ₺'den",
    description:
      "Türkiye için WhatsApp Business otomasyonu — toplu mesaj, randevu hatırlatma, AI chatbot. 499 ₺/ay'dan başlar. KDV dahil, 14 gün ücretsiz.",
    siteName: "WaSend",
  },
  twitter: {
    card: "summary_large_image",
    title: "WaSend — WhatsApp Otomasyon | 499 ₺'den",
    description:
      "WhatsApp Business otomasyon platformu. Toplu mesaj, chatbot, randevu hatırlatma — 499 ₺/ay.",
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
    <html lang="tr" suppressHydrationWarning>
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
