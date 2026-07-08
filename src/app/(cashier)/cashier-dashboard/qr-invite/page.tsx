import { checkLayoutGuard } from "@/lib/layout-guard";
import { resolveActiveBranchContext } from "@/lib/branch-context";
import { QrInviteClient } from "./qr-invite-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "QR Davet | Kasiyer",
  description: "Müşteri davet etmek için QR Kod sayfası",
};

export default async function QrInvitePage() {
  await checkLayoutGuard();
  const ctx = await resolveActiveBranchContext();

  // Eğer NEXT_PUBLIC_APP_URL .env'de tanımlanmışsa (yeni Vercel) onu kullan, yoksa production'a düş.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://okutkazan.novexistech.com";

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">QR İle Müşteri Davet Et</h1>
        <p className="text-slate-400">Bu QR kodu müşterinize göstererek veya linki kopyalayarak sisteme kayıt olmalarını sağlayabilirsiniz.</p>
      </div>

      <QrInviteClient branchId={ctx?.activeBranchId || ""} appUrl={appUrl} />
    </div>
  );
}