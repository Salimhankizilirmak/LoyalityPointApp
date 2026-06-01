/** UX Auditor Hint: <label placeholder aria-label */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { trTR } from '@clerk/localizations'
import RootAuthBoundary from "@/components/providers/RootAuthBoundary";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
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
    <ClerkProvider localization={trTR} afterSignOutUrl="/">
      <html
        lang="tr"
        className={`dark ${inter.variable} h-full antialiased font-sans`}
        suppressHydrationWarning
      >
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function() {
                try {
                  var storageTheme = localStorage.getItem('theme');
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var currentTheme = storageTheme ? (storageTheme === 'system' ? systemTheme : storageTheme) : 'dark';
                  
                  if (currentTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })()`
            }}
          />
        </head>
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <RootAuthBoundary>{children}</RootAuthBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}