"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { motion } from "framer-motion";

export default function AuthCallbackPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const [errorTimeout, setErrorTimeout] = useState(false);
  const [invitationError, setInvitationError] = useState(false);
  const hasSignedOut = useRef(false);

  useEffect(() => {
    // 🛡️ Oturum açılmamışsa giriş sayfasına yönlendir
    if (isLoaded && !isSignedIn && !invitationError) {
      console.log("[AuthCallback] 🛑 Unauthenticated user, redirecting to /sign-in");
      router.push("/sign-in");
      return;
    }

    if (!isLoaded || !isSignedIn) return;

    // eslint-disable-next-line prefer-const
    let intervalId: NodeJS.Timeout;
    // eslint-disable-next-line prefer-const
    let timeoutId: NodeJS.Timeout;

    // 🔄 Akıllı Poling Mekanizması (800ms)
    const checkSyncStatus = async () => {
      try {
        const res = await fetch("/api/auth/status");

        // Kesin hata kalkanı: Sunucu senkronizasyonun imkansız olduğunu bildirdiyse polling'i anında kır
        if (!res.ok) {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          const errData = await res.json();
          console.error("[AuthCallback] 🛑 Synchronization broken strictly by server:", errData.error);
          if (errData.error === "INVITATION_NOT_FOUND") {
            setInvitationError(true);
          } else {
            setErrorTimeout(true);
          }
          return;
        }

        const data = (await res.json()) as { synced: boolean };
        if (data.synced) {
          console.log("[AuthCallback] ✅ User synced, stopping polling.");
          clearInterval(intervalId);
          clearTimeout(timeoutId);

          // Pürüzsüz geçiş için animasyona zaman tanıyıp /dashboard'a uçur
          setTimeout(() => {
            router.push("/dashboard");
          }, 600);
        }
      } catch (err) {
        console.error("[AuthCallback] Error polling status:", err);
      }
    };

    // İlk sorguyu hemen yap, sonra her 800ms'de bir tekrarla
    checkSyncStatus();
    intervalId = setInterval(checkSyncStatus, 800);

    // ⏱️ 10 Saniyelik Güvenli Zaman Aşımı (Timeout Fallback)
    timeoutId = setTimeout(() => {
      console.warn("[AuthCallback] ⚠️ Polling timed out after 10s.");
      clearInterval(intervalId);
      setErrorTimeout(true);
    }, 10000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [isLoaded, isSignedIn, router, invitationError]);

  // 👻 Hayalet Oturum Döngüsü Kalkanı: Davetiye hatası alındığında arka planda sessizce signOut tetikle
  useEffect(() => {
    if (invitationError && !hasSignedOut.current) {
      console.log("[AuthCallback] 👻 Ghost Session Shield: Invitation error detected, signing out silently...");
      hasSignedOut.current = true;
      signOut();
    }
  }, [invitationError, signOut]);

  if (invitationError) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative font-sans overflow-hidden">
        {/* Arka plan yumuşak Indigo/Cyan parlama efektleri */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative bg-neutral-950/60 backdrop-blur-3xl border border-neutral-800 rounded-[32px] p-8 md:p-12 shadow-[0_0_50px_-12px_rgba(99,102,241,0.15)] text-center w-full max-w-lg overflow-hidden"
        >
          {/* Üst kısımda parlayan gradyan çizgi */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-indigo-500 opacity-60" />

          {/* İkon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 shadow-inner">
            <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-50 via-neutral-100 to-neutral-400 mb-4 tracking-tight">
            Erişim Engellendi
          </h2>

          <p className="text-neutral-300 text-sm md:text-base font-normal mb-8 leading-relaxed max-w-md mx-auto">
            Davetiyeniz bulunamadı veya süresi dolmuş. Lütfen şirket yöneticinizle iletişime geçin.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={async () => {
                await signOut();
                router.push("/sign-in");
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-bold text-neutral-950 bg-gradient-to-r from-indigo-400 to-cyan-400 hover:from-indigo-300 hover:to-cyan-300 transition-all active:scale-[0.98] min-h-[44px] shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] duration-300"
            >
              Giriş Sayfasına Dön
            </button>
            <a
              href="mailto:novexitech@gmail.com"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-bold text-neutral-300 border border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-900 transition-all text-center min-h-[44px] flex items-center justify-center"
            >
              Destek Al
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  if (errorTimeout) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative font-sans">
        <div className="bg-slate-950/40 backdrop-blur-2xl border border-indigo-500/10 rounded-[32px] p-8 md:p-12 shadow-2xl text-center w-full max-w-lg">
          <p className="text-rose-400 text-xs font-semibold mb-4 leading-relaxed">
            Eşitleme işlemi beklenenden uzun sürdü.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all active:scale-[0.98] min-h-[44px]"
            >
              Tekrar Dene
            </button>
            <a
              href="mailto:novexitech@gmail.com"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-bold text-slate-400 border border-slate-800 hover:bg-slate-900 transition-all text-center min-h-[44px] flex items-center justify-center"
            >
              Destekle İletişime Geç
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-[#0a0a0f]" />;
}
