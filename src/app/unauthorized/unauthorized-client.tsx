"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Home, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface UnauthorizedClientProps {
  isPending?: boolean;
}

export function UnauthorizedClient({ isPending = false }: UnauthorizedClientProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Eğer hesap hazırlık aşamasındaysa 3 saniyede bir dashboard'a girmeyi deneyebilir (webhook tamamlanmış olabilir)
    if (isPending) {
      const retryTimer = setInterval(() => {
        router.refresh();
      }, 3000);
      return () => clearInterval(retryTimer);
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, isPending]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Neon Efektleri */}
      {isPending ? (
        <>
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        </>
      )}

      {/* Cam Panel Konteyner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`w-full max-w-lg rounded-3xl p-8 md:p-10 border bg-[#0c0c14]/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden text-center ${
          isPending ? "border-indigo-500/20 shadow-indigo-950/20" : "border-red-500/20 shadow-red-950/20"
        }`}
      >
        {/* Neon Tepe Çizgisi */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${
          isPending ? "from-transparent via-indigo-500 to-transparent" : "from-transparent via-red-500 to-transparent"
        }`} />

        {/* Durum İkonu */}
        <div className="relative mx-auto w-20 h-20 mb-8">
          {isPending ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
            >
              <Loader2 size={40} className="animate-spin stroke-[1.5]" />
            </motion.div>
          ) : (
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            >
              <ShieldAlert size={40} className="stroke-[1.5]" />
            </motion.div>
          )}
          {/* Neon Halka */}
          <div className={`absolute inset-0 rounded-2xl border animate-ping opacity-30 ${
            isPending ? "border-indigo-500/20" : "border-amber-500/20"
          }`} />
        </div>

        {/* Başlık ve Mesaj */}
        <h1 className="text-white font-black text-2xl md:text-3xl tracking-tight mb-4 uppercase">
          {isPending ? "Hesabınız Hazırlanıyor" : "Erişim Reddedildi"}
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-md mx-auto mb-8 font-medium">
          {isPending
            ? "Davetiniz onaylandı! Hesabınızın kurulum işlemleri arka planda tamamlanıyor. Lütfen bu sayfayı kapatmayın, otomatik olarak yönlendirileceksiniz."
            : "Bu alana giriş yetkiniz bulunmamaktadır veya hesabınız silinmiştir. Lütfen geçerli bir davet adresi kullanın."}
        </p>

        {/* Bilgilendirme Kutusu */}
        <div className={`p-4 rounded-2xl border mb-8 flex items-center justify-center gap-3 bg-opacity-5 ${
          isPending 
            ? "border-indigo-500/10 bg-indigo-500/5 text-indigo-400" 
            : "border-red-500/10 bg-red-500/5 text-red-400"
        }`}>
          <span className={`w-2 h-2 rounded-full animate-pulse ${isPending ? "bg-indigo-500" : "bg-red-500"}`} />
          <span className="text-xs font-bold tracking-wider uppercase">
            {isPending ? "DURUM: AKTİVASYON BEKLENİYOR" : "Hata Kodu: 403 / UNAUTHORIZED"}
          </span>
        </div>

        {/* Sayaç ve İlerleme Çubuğu */}
        {!isPending && (
          <div className="mb-8">
            <p className="text-slate-500 text-xs font-semibold mb-2 uppercase tracking-widest">
              {countdown} saniye içinde ana sayfaya yönlendiriliyorsunuz...
            </p>
            <div className="w-full h-1 bg-slate-800/60 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
                className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"
              />
            </div>
          </div>
        )}

        {/* Butonlar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.push("/")}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 ${
              isPending 
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-indigo-900/30" 
                : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-900/30"
            }`}
          >
            <Home size={14} />
            Ana Sayfaya Dön
          </button>
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900/60 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            Geri Git
          </button>
        </div>
      </motion.div>
    </div>
  );
}
