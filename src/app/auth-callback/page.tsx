"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthCallbackPage() {
  const { isLoaded, isSignedIn, orgId } = useAuth();
  const router = useRouter();
  const [errorTimeout, setErrorTimeout] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    // 🛡️ Oturum açılmamışsa giriş sayfasına yönlendir
    if (isLoaded && !isSignedIn) {
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
          setErrorTimeout(true);
          return;
        }

        const data = (await res.json()) as { synced: boolean };
        if (data.synced) {
          console.log("[AuthCallback] ✅ User synced, stopping polling.");
          setSynced(true);
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
  }, [isLoaded, isSignedIn, router]);

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
              href="mailto:support@auralloyalty.com"
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
