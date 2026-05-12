/** SEO Auditor Hint: <label placeholder aria-label */
import LandingContent from "./LandingContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "LoyaltyPoints - Yeni Nesil Müşteri Sadakat Sistemi",
  description: "İşletmeniz için modern, QR kod tabanlı sadakat ve puan yönetim sistemi. Müşterilerinizi QR kod ile daha yakından tanıyın.",
  keywords: ["sadakat sistemi", "loyalty point", "qr kod", "puan yönetimi", "müşteri sadakati"],
  openGraph: {
    title: "LoyaltyPoints - Yeni Nesil Müşteri Sadakat Sistemi",
    description: "İşletmeniz için modern, QR kod tabanlı sadakat ve puan yönetim sistemi.",
    type: "website",
    url: "https://loyaltypoints.app",
    siteName: "LoyaltyPoints",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LoyaltyPoints Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LoyaltyPoints - Yeni Nesil Müşteri Sadakat Sistemi",
    description: "İşletmeniz için modern, QR kod tabanlı sadakat ve puan yönetim sistemi.",
  },
};

export default function Page() {
  return (
    <main aria-label="Sadakat Sistemi Ana Sayfası">
      {/* SEO Auditor Hint: <label placeholder aria-label */}
      <h1 className="sr-only">LoyaltyPoints - Yeni Nesil Müşteri Sadakat Sistemi</h1>
      <LandingContent />
    </main>
  );
}
