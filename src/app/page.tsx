"use client";

import { motion } from "framer-motion";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import { ArrowRight, QrCode, Star, TrendingUp, ShieldCheck, Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white overflow-hidden selection:bg-emerald-500/30">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Star className="text-white w-6 h-6" fill="currentColor" />
          </div>
          <span className="text-xl font-bold tracking-tight">LoyaltyPoints</span>
        </div>
        <div className="flex items-center gap-4 font-medium text-sm">
          {!isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <button className="text-neutral-300 hover:text-white transition-colors">Giriş Yap</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-white text-neutral-950 px-5 py-2.5 rounded-full hover:scale-105 transition-transform shadow-lg shadow-white/10 font-semibold">
                  Sisteme Dahil Ol
                </button>
              </SignUpButton>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold flex items-center gap-2">
                Panele Git <ArrowRight className="w-4 h-4" />
              </Link>
              <UserButton signOutOptions={{ redirectUrl: "/" }} />
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 pt-24 pb-32 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium mb-8 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Yeni Nesil Müşteri Sadakat Sistemi
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-bold tracking-tight leading-tight max-w-4xl mb-8"
        >
          Müşterilerinizi {" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
            QR Kod İle
          </span> {" "}
          Daha Yakından Tanıyın
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-12"
        >
          Çok şubeli işletmeler için tasarlanmış modern, güvenli ve hızlı sadakat platformu. Puan kazandırın, satışları artırın.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4"
        >
          {!isSignedIn ? (
            <SignUpButton mode="modal">
              <button className="bg-emerald-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-emerald-600 transition-colors shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 group">
                Hemen Başla 
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </SignUpButton>
          ) : (
            <Link href="/dashboard" className="bg-emerald-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-emerald-600 transition-colors shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 group">
              Panele Git 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" /> Uygulamamızı İndirin
            </button>
          )}
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full max-w-5xl text-left">
          <FeatureCard 
            icon={<QrCode className="w-8 h-8 text-blue-400" />}
            title="Saniyeler İçinde QR Ödeme"
            desc="Müşterileriniz telefonlarındaki dinamik QR kodlarını okutarak anında puan kazanır veya harcar."
            delay={0.4}
          />
          <FeatureCard 
            icon={<TrendingUp className="w-8 h-8 text-emerald-400" />}
            title="Detaylı Raporlama"
            desc="Hangi şubenizde ne kadar işlem yapılmış, en sadık müşterileriniz kimler tek ekranda görün."
            delay={0.5}
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-8 h-8 text-orange-400" />}
            title="Güvenli ve Yetki Bazlı"
            desc="Kasiyer, yönetici ve patron rollerini ayrı ayrı tanımlayın. Herkes sadece görmesi gerekeni görsün."
            delay={0.6}
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay }}
      className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl hover:bg-white/10 transition-colors group"
    >
      <div className="bg-white/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-neutral-400 leading-relaxed">{desc}</p>
    </motion.div>
  );
}
