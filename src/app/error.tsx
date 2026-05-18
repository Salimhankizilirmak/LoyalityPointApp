"use client";

import { useEffect } from "react";
import { AlertOctagon, RefreshCw, Home } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Çalışma zamanı hatasını sunucuya veya konsola logla
    console.error("💥 [Runtime Error Boundary]:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden font-sans text-white">
      {/* Radial Neon Amber & Kırmızı Arka Plan Parıltıları */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Cam Panel Konteyner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-xl rounded-3xl p-8 md:p-12 border border-amber-500/20 bg-[#0c0c14]/70 backdrop-blur-3xl shadow-2xl relative overflow-hidden text-center"
      >
        {/* Cam Efekti Üst Çizgi Parıltısı */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        {/* Hata İkonu */}
        <div className="relative mx-auto w-24 h-24 mb-8">
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.15)]"
          >
            <AlertOctagon size={48} className="stroke-[1.5]" />
          </motion.div>
          {/* Neon Ring */}
          <div className="absolute inset-0 rounded-3xl border border-red-500/10 animate-ping opacity-25" />
        </div>

        {/* Başlık ve Mesaj */}
        <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-4 uppercase bg-gradient-to-r from-amber-200 via-white to-red-200 bg-clip-text text-transparent">
          Bir Hata Oluştu
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-md mx-auto mb-8 font-medium">
          Çalışma zamanında beklenmeyen bir hata tespit edildi. Sistem arayüz bütünlüğü korunmuş olup, aşağıdaki butonları kullanarak devam edebilirsiniz.
        </p>

        {/* Hata Detay Alanı (Dışa Kapalı Tasarım) */}
        <div className="text-left p-4 rounded-2xl border border-white/5 bg-white/2 mb-8 font-mono text-xs text-slate-500 max-h-36 overflow-y-auto custom-scrollbar relative">
          <p className="font-semibold text-amber-400/80 mb-1">Hata Bilgisi:</p>
          <p className="break-all whitespace-pre-wrap">{error.message || "Bilinmeyen çalışma zamanı istisnası."}</p>
          {error.digest && (
            <p className="mt-2 text-white/40">
              Hata Kimliği (Digest): <span className="text-white/60">{error.digest}</span>
            </p>
          )}
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <RefreshCw size={14} className="animate-spin-slow" />
            Sistemi Yeniden Dene
          </button>
          <button
            onClick={() => {
              router.push("/");
              reset();
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/80 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <Home size={14} />
            Ana Sayfaya Git
          </button>
        </div>
      </motion.div>
    </div>
  );
}
