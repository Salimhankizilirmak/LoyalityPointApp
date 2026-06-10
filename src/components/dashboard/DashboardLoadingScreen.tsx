"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Sparkles, Loader2 } from "lucide-react";

interface DashboardLoadingScreenProps {
  userName?: string | null;
  orgName?: string | null;
  logoUrl?: string | null;
}

const LOADING_STEPS = [
  "Sistem güvenliği doğrulanıyor...",
  "Sadakat hareketleri senkronize ediliyor...",
  "Şube limitleri ve üye profili yükleniyor...",
  "Arayüz bileşenleri optimize ediliyor..."
];

export function DashboardLoadingScreen({
  userName,
  orgName,
  logoUrl
}: DashboardLoadingScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const mountTimeRef = useRef(0);
  const mountTime = mountTimeRef.current;

  useEffect(() => {
    mountTimeRef.current = typeof window !== "undefined" ? performance.now() : 0;
  }, []);

  useEffect(() => {
    console.log(`🎯 [TELEMETRİ] DashboardLoadingScreen Ekrana Geldi. Kullanıcı: ${userName || 'Anonim'}`);
    return () => {
      const duration = performance.now() - mountTime;
      console.log(`⏱️ [TELEMETRİ] DashboardLoadingScreen Ekrandan Kayboldu. Kalma Süresi: ${duration.toFixed(2)}ms`);
    };
  }, [userName]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07070c] overflow-hidden">
      {/* Ambient background glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main glassmorphic container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-md w-full mx-4 p-8 rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-2xl shadow-[0_24px_50px_-12px_rgba(0,0,0,0.7)] text-center overflow-hidden"
      >
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-50" />

        {/* Top glowing panel border */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

        {/* Animated logo/avatar container */}
        <div className="relative mx-auto mb-6 w-24 h-24 flex items-center justify-center">
          {/* Pulsing ring */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 blur-md"
          />

          {/* Rotating borders */}
          <div className="absolute inset-0 rounded-2xl border border-cyan-500/20 animate-spin" style={{ animationDuration: "12s" }} />
          <div className="absolute inset-1 rounded-2xl border border-dashed border-indigo-500/10 animate-spin-reverse" style={{ animationDuration: "18s" }} />

          {/* Logo element */}
          <div className="relative w-16 h-16 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center overflow-hidden shadow-inner group">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Logo"
                width={64}
                height={64}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                priority
              />
            ) : (
              <div className="relative w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center">
                <motion.div
                  animate={{ y: [-2, 2, -2] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="text-cyan-400"
                >
                  <Sparkles className="w-8 h-8 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* Welcome message */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-lg font-bold text-white tracking-tight"
        >
          Hoş geldiniz{userName ? `, ${userName}` : ""}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs text-slate-400 mt-1 font-medium"
        >
          {orgName ? `${orgName} paneli` : "Sadakat Sistemi"} hazırlanıyor, lütfen bekleyiniz...
        </motion.p>

        {/* Separator line */}
        <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

        {/* Live status loading step */}
        <div className="min-h-[20px] flex items-center justify-center gap-2">
          <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <div className="overflow-hidden">
            <span className="text-[11px] font-mono text-cyan-400/80 tracking-wider inline-block">
              {LOADING_STEPS[stepIndex]}
            </span>
          </div>
        </div>

        {/* Glowing Progress bar */}
        <div className="mt-5 w-full h-1.5 bg-slate-950/60 rounded-full overflow-hidden border border-slate-900">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              repeat: Infinity,
              duration: 2.2,
              ease: "easeInOut"
            }}
            className="w-1/2 h-full rounded-full bg-gradient-to-r from-transparent via-cyan-500 to-indigo-500"
          />
        </div>
      </motion.div>
    </div>
  );
}
