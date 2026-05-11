import { Lock, LogOut, MessageSquare } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

export default function OrgDisabledPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 text-white overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-amber-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        <div className="w-24 h-24 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/20">
          <Lock className="text-amber-500 w-12 h-12" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight">İşletme Hesabı Pasif</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">
            Bağlı olduğunuz organizasyon sistem yöneticisi tarafından dondurulmuştur. Lütfen şube müdürünüz veya sistem sahibi ile iletişime geçin.
          </p>
        </div>

        <div className="pt-8 flex flex-col gap-4">
          <button className="bg-amber-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-amber-600 transition-all flex items-center justify-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Destek Al
          </button>
          
          <SignOutButton>
            <button className="text-neutral-500 hover:text-rose-400 transition-all text-sm font-medium flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" />
              Oturumu Kapat
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
