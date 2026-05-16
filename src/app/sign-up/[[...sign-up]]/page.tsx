import { ShieldAlert, Mail } from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SignUpForm from "./sign-up-form";

export default async function SignUpPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  params: Promise<{ "sign-up"?: string[] }>;
}) {
  const authData = await auth();
  if (authData.userId) {
    redirect("/dashboard");
  }

  const [sParams, routeParams] = await Promise.all([searchParams, params]);
  
  // Clerk davetiyeleri __clerk_ticket (genel davet) veya __clerk_invitation_token (org daveti) ile gelir
  const hasTicketInUrl = !!sParams?.__clerk_ticket || !!sParams?.ticket || !!sParams?.__clerk_invitation_token;
  
  // Sadece ANA /sign-up sayfasında bilet kontrolü yap.
  // Alt sayfalardaysak (sso-callback vb.), bilet sessionStorage'dan çekileceği için geçişe izin ver.
  const isRootSignUp = !routeParams["sign-up"] || routeParams["sign-up"].length === 0;
  
  // Güvenlik Kapısı: Root'ta bilet yoksa ve SSO callback değilse engelle
  if (isRootSignUp && !hasTicketInUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 p-6">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rose-600/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/10 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-md w-full text-center space-y-8 bg-white/5 p-10 rounded-[2.5rem] border border-white/10 backdrop-blur-xl">
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto border border-rose-500/20">
            <ShieldAlert className="text-rose-500 w-10 h-10" />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-black text-white tracking-tight">Kayıt Kapalı</h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Bu sisteme yalnızca bir yönetici tarafından gönderilen **e-posta davetiyesi** ile kayıt olunabilir.
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-start gap-3 text-left">
            <Mail className="text-cyan-500 w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-neutral-400 leading-normal">
              Eğer bir davet bekliyorsanız, lütfen e-posta kutunuzu (ve spam klasörünü) kontrol edin ve davet linkine tıklayarak kayıt olun.
            </p>
          </div>

          <div className="pt-4">
            <Link href="/dashboard" className="text-cyan-500 hover:text-cyan-400 transition-colors text-xs font-bold uppercase tracking-widest">
              Zaten hesabınız var mı? Giriş Yapın
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-950">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>
      <div className="relative z-10">
        <SignUpForm />
      </div>
    </div>
  );
}
