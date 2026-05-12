import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#13131b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "LoyaltyPoints | Yeni Nesil Müşteri Sadakat Sistemi",
  description: "İşletmeniz için modern, QR kod tabanlı ve güvenli müşteri sadakat platformu. Puan kazandırın, müşteri bağlılığını artırın.",
  keywords: ["sadakat programı", "puan sistemi", "müşteri sadakati", "QR kod puan", "LC Waikiki sadakat"],
  authors: [{ name: "LoyaltyPoints Team" }],
  openGraph: {
    title: "LoyaltyPoints | Müşterilerinizi Yakından Tanıyın",
    description: "QR kod ile saniyeler içinde puan kazandırın ve detaylı raporlama ile işletmenizi büyütün.",
    url: "https://loyaltypoints.app",
    siteName: "LoyaltyPoints",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LoyaltyPoints | Müşteri Sadakat Sistemi",
    description: "Yeni nesil QR kod tabanlı sadakat platformu.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Loyalty",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html
        lang="tr"
        className={`dark ${inter.variable} h-full antialiased font-sans`}
        aria-label="LoyaltyPoints Application"
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
      </html>
    </ClerkProvider>
  );
}
