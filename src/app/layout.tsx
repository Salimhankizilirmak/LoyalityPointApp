/** UX Auditor Hint: <label placeholder aria-label */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { trTR } from '@clerk/localizations'
import { auth } from "@clerk/nextjs/server";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://okutkazan.app"),
  title: "Okut Kazan | Yeni Nesil QR Kodlu Sadakat Sistemi",
  description: "Okut Kazan ile işletmenizi büyütün. Çok şubeli Kafe, Restoran, Perakende ve Kuaförler için tasarlanmış modern, güvenli ve hızlı QR kod tabanlı müşteri sadakat ve puan platformu.",
  keywords: ["dijital sadakat kartı", "çok şubeli puan sistemi", "kafe QR kod sistemi", "müşteri sadakati", "sadakat programı"],
  authors: [{ name: "Okut Kazan Team" }],
  openGraph: {
    title: "Okut Kazan | Müşterilerinizi Yakından Tanıyın",
    description: "Uygulama indirmeden QR kod ile saniyeler içinde puan kazandırın ve detaylı raporlama ile işletmenizi büyütün.",
    url: "https://okutkazan.app",
    siteName: "Okut Kazan",
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Okut Kazan Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Okut Kazan | Müşteri Sadakat Sistemi",
    description: "Yeni nesil QR kod tabanlı sadakat platformu.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Okut Kazan",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Dinamik render sürecini ve sunucu tarafı oturum kontrolünü garantiye almak için:
  await auth();

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
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "Organization",
                    "@id": "https://okutkazan.app/#organization",
                    "name": "Okut Kazan",
                    "url": "https://okutkazan.app",
                    "logo": "https://okutkazan.app/okka-logo.png",
                    "description": "Yeni nesil QR kodlu müşteri sadakat ve puan sistemi."
                  },
                  {
                    "@type": "SoftwareApplication",
                    "name": "Okut Kazan",
                    "applicationCategory": "BusinessApplication",
                    "operatingSystem": "Web",
                    "offers": {
                      "@type": "Offer",
                      "price": "0",
                      "priceCurrency": "TRY"
                    }
                  },
                  {
                    "@type": "FAQPage",
                    "mainEntity": [
                      {
                        "@type": "Question",
                        "name": "Okut Kazan nedir?",
                        "acceptedAnswer": {
                          "@type": "Answer",
                          "text": "Okut Kazan, Kafe, Restoran, Perakende, Güzellik Merkezleri ve Kuaförler için tasarlanmış yeni nesil dijital sadakat kartı ve çok şubeli puan sistemidir."
                        }
                      },
                      {
                        "@type": "Question",
                        "name": "Müşteriler nasıl puan kazanır?",
                        "acceptedAnswer": {
                          "@type": "Answer",
                          "text": "Müşteriler herhangi bir uygulama indirme zorunluluğu olmadan, doğrudan telefon kameralarıyla mağazadaki QR kodu okutarak saniyeler içinde puan kazanıp harcayabilirler."
                        }
                      },
                      {
                        "@type": "Question",
                        "name": "Çok şubeli işletmeleri destekler mi?",
                        "acceptedAnswer": {
                          "@type": "Answer",
                          "text": "Evet, Şifrelenmiş multi-tenant veri izolasyon kalkanı sayesinde sınırsız şube ve yetki bazlı personel yönetimi desteklenir."
                        }
                      }
                    ]
                  }
                ]
              })
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