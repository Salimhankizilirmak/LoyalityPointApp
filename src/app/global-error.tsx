"use client";

import { useEffect } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("🚨 [CRITICAL ROOT ERROR]:", error);
  }, [error]);

  return (
    <html lang="tr">
      <head>
        <title>Kritik Sistem Hatası - Aura Loyalty</title>
        <meta name="description" content="Aura Loyalty platformu kritik sistem hata kurtarma istasyonu." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Kritik Sistem Hatası - Aura Loyalty" />
        <meta property="og:description" content="Aura Loyalty platformu kritik sistem hata kurtarma istasyonu." />
      </head>
      <body className="bg-[#0a0a0f] text-white min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans select-none m-0">
        {/* Radial Neon Glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />

        {/* Cam Panel Konteyner */}
        <div className="w-full max-w-xl rounded-3xl p-8 md:p-12 border border-red-500/20 bg-[#0c0c14]/80 backdrop-blur-3xl shadow-2xl relative overflow-hidden text-center">
          {/* Cam Efekti Üst Çizgi Parıltısı */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

          {/* Kriter İkonu */}
          <div className="relative mx-auto w-24 h-24 mb-8">
            <div className="w-24 h-24 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <ShieldAlert size={48} className="stroke-[1.5]" />
            </div>
            <div className="absolute inset-0 rounded-3xl border border-red-500/20 animate-ping opacity-30 pointer-events-none" />
          </div>

          {/* Başlık */}
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-4 uppercase bg-gradient-to-r from-red-200 via-white to-amber-200 bg-clip-text text-transparent">
            Kritik Çekirdek Hatası
          </h1>
          
          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-md mx-auto mb-8 font-medium">
            Uygulamanın kök katmanında kritik bir istisna saptandı. Sistem kararlılığı için kurtarma istasyonu devreye alınmıştır.
          </p>

          {/* Hata Detay Alanı */}
          <div className="text-left p-4 rounded-2xl border border-white/5 bg-white/2 mb-8 font-mono text-xs text-slate-500 max-h-36 overflow-y-auto relative">
            <p className="font-semibold text-red-400/80 mb-1">Kök Hata Bilgisi:</p>
            <p className="break-all whitespace-pre-wrap">{error.message || "Bilinmeyen kök katman istisnası."}</p>
            {error.digest && (
              <p className="mt-2 text-white/40">
                Digest ID: <span className="text-white/60">{error.digest}</span>
              </p>
            )}
          </div>

          {/* Sistemi Sıfırla Butonu */}
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 mx-auto cursor-pointer min-h-[44px]"
          >
            <RefreshCw size={14} className="animate-spin-slow" />
            Sistemi Yeniden Yükle
          </button>
        </div>
      </body>
    </html>
  );
}
