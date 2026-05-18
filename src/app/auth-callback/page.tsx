"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthCallbackPage() {
  const { isLoaded, isSignedIn } = useAuth();
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
        if (res.ok) {
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

  // Yüklenme durumunda boş ekran yerine stabil iskelet
  if (!isLoaded) {
    return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center" />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Arka Plan Yumuşak Işık Efektleri */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {!synced ? (
          <motion.div
            key="loading-container"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-lg"
          >
            {/* Cam Panel Kartı */}
            <div className="bg-slate-950/40 backdrop-blur-2xl border border-indigo-500/10 rounded-[32px] p-8 md:p-12 shadow-2xl shadow-indigo-950/20 text-center relative overflow-hidden">
              
              {/* Dalgalı / Pulsing Animasyonu */}
              <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                {/* Dış Halka Nabızları */}
                <motion.div
                  animate={{ scale: [1, 2.2], opacity: [0.15, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border border-indigo-500"
                />
                <motion.div
                  animate={{ scale: [1, 1.8], opacity: [0.2, 0] }}
                  transition={{ duration: 2.2, delay: 0.7, repeat: Infinity, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border border-teal-500"
                />
                
                {/* Merkez Küre */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
                </div>
              </div>

              {/* Başlık ve Alt Başlık */}
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-relaxed mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-indigo-300 to-teal-400">
                  Şirketiniz kuruluyor patron,
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-teal-300">
                  lütfen bekleyin...
                </span>
              </h1>

              <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed max-w-sm mx-auto mb-8">
                Güvenli multi-tenant veritabanı alanınız ve şubeleriniz optimize ediliyor.
              </p>

              {/* Hata ve Çıkış/Yeniden Dene Fallback'i */}
              <AnimatePresence>
                {errorTimeout && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-6 border-t border-slate-800/60"
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          /* Başarı Durumunda Pürüzsüz Giriş Animasyonu */
          <motion.div
            key="success-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-400 font-bold text-sm tracking-wide">Hazır! Yönlendiriliyorsunuz...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
