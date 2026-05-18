"use client";

import { useRouter } from "next/navigation";
import { HelpCircle, Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden font-sans text-white">
      {/* Radial Neon Indigo & Cyan Parıltıları */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Cam Panel Konteyner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-xl rounded-3xl p-8 md:p-12 border border-cyan-500/20 bg-[#0c0c14]/75 backdrop-blur-3xl shadow-2xl relative overflow-hidden text-center"
      >
        {/* Cam Efekti Üst Çizgi Parıltısı */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

        {/* Büyük 404 Neon Metin */}
        <div className="relative mb-6 select-none">
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-8xl md:text-9xl font-black tracking-widest text-slate-800/20 uppercase"
            style={{ WebkitTextStroke: "1px rgba(6,182,212,0.15)" }}
          >
            404
          </motion.h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
            >
              <HelpCircle size={40} className="stroke-[1.5]" />
            </motion.div>
          </div>
        </div>

        {/* Başlık ve Mesaj */}
        <h2 className="text-xl md:text-2xl font-black tracking-tight mb-4 uppercase bg-gradient-to-r from-cyan-200 via-white to-indigo-200 bg-clip-text text-transparent">
          Sayfa Bulunamadı
        </h2>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-md mx-auto mb-8 font-medium">
          Aradığınız sayfa kaldırılmış, adı değiştirilmiş veya geçici olarak kullanım dışı bırakılmış olabilir. Lütfen URL adresini kontrol edin.
        </p>

        {/* Küçük Durum Kodu Rozeti */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/10 bg-cyan-500/5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase">
            STATUS: 404 / OBJECT NOT FOUND
          </span>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <Home size={14} />
            Ana Sayfaya Dön
          </button>
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/80 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <ArrowLeft size={14} />
            Geri Git
          </button>
        </div>
      </motion.div>
    </div>
  );
}
