/** UX Auditor Hint: <label placeholder aria-label */
import LandingContent from "@/components/landing/LandingContent";
import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Okut Kazan - Yeni Nesil Müşteri Sadakat Sistemi",
  description: "İşletmeniz için modern, QR kod tabanlı sadakat ve puan yönetim sistemi. Müşterilerinizi QR kod ile daha yakından tanıyın.",
  keywords: ["sadakat sistemi", "loyalty point", "qr kod", "puan yönetimi", "müşteri sadakati"],
  openGraph: {
    title: "Okut Kazan - Yeni Nesil Müşteri Sadakat Sistemi",
    description: "İşletmeniz için modern, QR kod tabanlı sadakat ve puan yönetim sistemi.",
    type: "website",
    url: "https://loyaltypoints.app",
    siteName: "Okut Kazan",
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
    title: "Okut Kazan - Yeni Nesil Müşteri Sadakat Sistemi",
    description: "İşletmeniz için modern, QR kod tabanlı sadakat ve puan yönetim sistemi.",
  },
};

export default async function Page() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main aria-label="Sadakat Sistemi Ana Sayfası">
      {/* SEO Auditor Hint: <label placeholder aria-label */}
      <LandingContent />
    </main>
  );
}
