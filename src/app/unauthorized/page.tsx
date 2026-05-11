import Link from "next/link";
import { ShieldAlert, LogOut } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 text-white overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rose-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        <div className="w-24 h-24 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto border border-rose-500/20 animate-pulse">
          <ShieldAlert className="text-rose-500 w-12 h-12" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight">Giriş Engellendi</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">
            Sisteme giriş izniniz bulunmamaktadır. Bu platform yalnızca davet edilen yetkili personeller içindir.
          </p>
        </div>

        <div className="pt-8 flex flex-col gap-4">
          <SignOutButton>
            <button className="bg-white text-neutral-950 px-8 py-4 rounded-2xl font-bold hover:bg-neutral-100 transition-all flex items-center justify-center gap-2 group">
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Oturumu Kapat
            </button>
          </SignOutButton>
          
          <Link href="/" className="text-neutral-500 hover:text-white transition-colors text-sm font-medium">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
