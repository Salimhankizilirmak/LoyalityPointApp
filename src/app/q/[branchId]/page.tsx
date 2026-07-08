import { QrFormClient } from "./qr-form-client";
import { Metadata } from "next";
import { db } from "@/db";
import { branches } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Müşteri Kayıt | Loyalty",
  description: "Müşteri kayıt ekranı",
};

export default async function PublicQrRegisterPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;

  if (!branchId) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center max-w-sm">
          <h1 className="text-red-500 font-bold text-xl mb-2">Geçersiz Bağlantı</h1>
          <p className="text-slate-400 text-sm">
            Bu bağlantı geçersiz veya eksik. Lütfen kasadaki QR kodunu tekrar okutun.
          </p>
        </div>
      </div>
    );
  }

  // Branch kontrolü (Güvenlik)
  const branch = await db.select({ name: branches.name }).from(branches).where(eq(branches.id, branchId)).get();
  
  if (!branch) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center max-w-sm">
          <h1 className="text-red-500 font-bold text-xl mb-2">Şube Bulunamadı</h1>
          <p className="text-slate-400 text-sm">
            İlgili şube sistemde bulunamadı. Lütfen mağaza görevlisine danışın.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col pt-12 px-4 selection:bg-cyan-500/30">
      <div className="w-full max-w-md mx-auto text-center mb-8">
        <h2 className="text-cyan-500 font-bold text-lg">{branch.name}</h2>
        <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Hoş Geldiniz</p>
      </div>

      <QrFormClient branchId={branchId} />
    </div>
  );
}
