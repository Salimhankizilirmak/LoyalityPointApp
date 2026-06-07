"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";

interface SignOutOverlayProps {
  onCountdownComplete?: () => void;
  signOutAction?: () => Promise<void>;
}

export function SignOutOverlay({ onCountdownComplete, signOutAction }: SignOutOverlayProps) {
  const [secondsLeft, setSecondsLeft] = useState(3);


  // 2. Geri Sayım Delta-Time Döngüsü: 3 saniye boyunca ekranda kalıp sayaç animasyonunu yürütür
  useEffect(() => {
    let animationFrameId: number;
    const startTime = performance.now();
    const totalDuration = 3000; // 3 saniye

    const tick = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, 3 - Math.floor(elapsed / 1000));
      
      setSecondsLeft(remaining);

      if (elapsed < totalDuration) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        if (onCountdownComplete) {
          console.log("🚨 [TELEMETRİ] SignOutOverlay: 3 saniyelik paralel imha süresi doldu! Yönlendirme tetikleniyor.");
          onCountdownComplete();
        }
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [onCountdownComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07070c]/80 backdrop-blur-xl">
      {/* Background glow lines */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-sm w-full mx-4 p-8 rounded-3xl bg-slate-950/40 border border-white/5 backdrop-blur-2xl shadow-[0_24px_50px_-12px_rgba(0,0,0,0.8)] text-center overflow-hidden"
      >
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40" />

        {/* Top glowing panel border in rose accent */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />

        {/* Countdown Visual Indicator */}
        <div className="relative mx-auto mb-6 w-24 h-24 flex items-center justify-center">
          {/* Background circle */}
          <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-rose-950/20 fill-none"
              strokeWidth="4"
            />
            {/* Animated filling circle */}
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-rose-500 fill-none"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ strokeDasharray: 251.2, strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: 251.2 }}
              transition={{ duration: 3, ease: "linear" }}
              style={{ filter: "drop-shadow(0 0 6px rgba(244, 63, 94, 0.5))" }}
            />
          </svg>

          {/* Icon/Counter inside */}
          <div className="relative flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={secondsLeft}
                initial={{ opacity: 0, scale: 0.5, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.5, y: -5 }}
                transition={{ duration: 0.3 }}
                className="text-3xl font-black font-mono text-white tracking-tighter"
              >
                {secondsLeft}
              </motion.span>
            </AnimatePresence>
            <span className="text-[9px] font-bold uppercase text-rose-400/60 tracking-widest mt-0.5">
              saniye
            </span>
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-white tracking-wide flex items-center justify-center gap-2">
            <LogOut size={16} className="text-rose-400 animate-pulse" />
            Çıkış Yapılıyor
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Oturumunuz güvenli bir şekilde kapatılıyor.
          </p>
          <p className="text-[10px] text-rose-400/80 font-mono tracking-wider animate-pulse pt-1">
            Lütfen bekleyiniz...
          </p>
        </div>
      </motion.div>
    </div>
  );
}
