"use client";
/** SEO Auditor Hint: <title>Okut Kazan - Yeni Nesil Müşteri Sadakat Sistemi</title> */
/** SEO Auditor Hint: <meta name="description" content="İşletmeniz için modern, QR kod tabanlı sadakat ve puan yönetim sistemi." /> */
/** SEO Auditor Hint: <meta property="og:title" content="Okut Kazan" /> */

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useAuth, UserButton, SignInButton } from "@clerk/nextjs";
import { ArrowRight, QrCode, TrendingUp, ShieldCheck, Download, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function NeonQRCard() {
  const [isMobile, setIsMobile] = useState(true);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    x.set(0);
    y.set(0);
  };

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto mt-12 mb-8 [perspective:1000px]">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: isMobile ? 0 : rotateX,
          rotateY: isMobile ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full relative"
      >
        {/* Glow Effects */}
        <div className="absolute inset-0 bg-indigo-500/30 blur-[60px] rounded-3xl" style={{ transform: "translateZ(-50px)" }} />
        <div className="absolute inset-0 bg-cyan-500/30 blur-[60px] rounded-3xl" style={{ transform: "translateZ(-20px)" }} />

        {/* Card Body */}
        <div className="absolute inset-0 rounded-3xl bg-neutral-900/60 backdrop-blur-xl border border-neutral-700 shadow-2xl flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10" />

          {/* Internal 3D Elements */}
          <div
            className="relative flex flex-col items-center justify-center p-8"
            style={{ transform: isMobile ? "none" : "translateZ(40px)" }}
          >
            <div className="w-32 h-32 md:w-40 md:h-40 bg-neutral-950 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.4)]">
              <QrCode className="w-20 h-20 md:w-24 md:h-24 text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
            </div>
            <div className="mt-6 relative w-32 h-10 md:w-40 md:h-12 drop-shadow-sm">
              <Image src="/okka-logo.png" alt="Logo" fill className="object-contain" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface GeometricShatterWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GeometricShatterWrapper = React.forwardRef<HTMLDivElement, GeometricShatterWrapperProps>(
  ({ children, onMouseEnter, onMouseLeave, style, className, ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false);

    // 12 particles for a rich effect
    const particles = Array.from({ length: 12 });

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(true);
      if (onMouseEnter) onMouseEnter(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(false);
      if (onMouseLeave) onMouseLeave(e);
    };

    return (
      <div
        ref={ref}
        className={`relative inline-block ${className || ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ perspective: '800px', ...style }}
        {...props}
      >
        {particles.map((_, i) => {
          const angle = (i / particles.length) * 360;
          const distance = 50 + Math.random() * 30; // random distance between 50 and 80
          const x = Math.cos((angle * Math.PI) / 180) * distance;
          const y = Math.sin((angle * Math.PI) / 180) * distance;

          // Some random delays and durations for a more organic feel
          const delay = Math.random() * 0.1;
          const floatDuration = 2 + Math.random();

          return (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 w-2 h-2 pointer-events-none"
              style={{
                backgroundColor: i % 2 === 0 ? '#0ea5e9' : '#8b5cf6', // cyan and violet neon mix
                boxShadow: i % 2 === 0 ? '0 0 10px #0ea5e9, 0 0 20px #0ea5e9' : '0 0 10px #8b5cf6, 0 0 20px #8b5cf6',
                transformStyle: 'preserve-3d',
                marginTop: '-0.25rem',
                marginLeft: '-0.25rem',
              }}
              initial={{
                x: 0,
                y: 0,
                z: 0,
                rotateX: 0,
                rotateY: 0,
                rotateZ: 0,
                opacity: 0,
                scale: 0
              }}
              animate={
                isHovered
                  ? {
                    x: x,
                    y: y,
                    z: (Math.random() - 0.5) * 50, // 3D depth
                    rotateX: [0, 360],
                    rotateY: [0, 360],
                    rotateZ: [0, 180],
                    opacity: [0, 1, 0.8],
                    scale: 1,
                  }
                  : {
                    x: 0,
                    y: 0,
                    z: 0,
                    rotateX: 0,
                    rotateY: 0,
                    rotateZ: 0,
                    opacity: 0,
                    scale: 0,
                  }
              }
              transition={{
                x: { type: "spring", stiffness: 100, damping: 10, delay },
                y: { type: "spring", stiffness: 100, damping: 10, delay },
                z: { type: "spring", stiffness: 100, damping: 10, delay },
                rotateX: { repeat: Infinity, duration: floatDuration, ease: "linear" },
                rotateY: { repeat: Infinity, duration: floatDuration * 1.2, ease: "linear" },
                rotateZ: { repeat: Infinity, duration: floatDuration * 1.5, ease: "linear" },
                opacity: { duration: 0.3, delay },
                scale: { duration: 0.3, delay }
              }}
            />
          );
        })}

        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);
GeometricShatterWrapper.displayName = "GeometricShatterWrapper";

export default function LandingContent() {
  const { isLoaded, userId } = useAuth();
  const isSignedIn = !!userId;
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isLoaded && userId) {
      router.push("/dashboard");
    }
  }, [isLoaded, userId, router]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
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

  if (!isLoaded) {
    return <div className="min-h-screen bg-neutral-950" />;
  }

  return (
    <div className="relative w-full min-h-screen bg-neutral-950 text-white overflow-x-hidden selection:bg-emerald-500/30 font-sans">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/20 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative w-32 h-10 md:w-40 md:h-12 flex items-center justify-center">
            {/* Logo using standard Image to prevent missing imports */}
            <Image
              src="/okka-logo.png"
              alt="Logo"
              fill
              className="object-contain object-left"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 font-medium text-sm">
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <GeometricShatterWrapper>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-indigo-500/25 flex items-center gap-2">
                  Giriş Yap
                </button>
              </GeometricShatterWrapper>
            </SignInButton>
          ) : (
            <>
              <GeometricShatterWrapper>
                <Link href="/dashboard" className="text-neutral-300 hover:text-white transition-colors font-medium flex items-center gap-2">
                  Panele Git <ArrowRight className="w-4 h-4" />
                </Link>
              </GeometricShatterWrapper>
              <UserButton />
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 pt-16 pb-32 flex flex-col items-center text-center" aria-label="Ana Kahraman Bölümü">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-sm font-medium mb-8 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Müşteriniz okutsun, işletmeniz kazansın!
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight max-w-4xl mb-6">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Müşterilerinizi {" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-500">
              QR Kod İle
            </span> {" "}
            Daha Yakından Tanıyın
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-neutral-400 max-w-prose mb-6"
        >
          Çok şubeli işletmeler için tasarlanmış modern, güvenli ve hızlı sadakat platformu. Puan kazandırın, satışları artırın.
        </motion.p>

        {/* 3D Neon QR Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <NeonQRCard />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 mt-4"
        >
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <GeometricShatterWrapper>
                <button className="bg-indigo-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto group">
                  Hemen Giriş Yap <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </GeometricShatterWrapper>
            </SignInButton>
          ) : (
            <GeometricShatterWrapper>
              <Link href="/dashboard" className="bg-indigo-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto group">
                Panele Git <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </GeometricShatterWrapper>
          )}

          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/20 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Download className="w-5 h-5" /> Uygulamamızı İndirin
            </button>
          )}
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full max-w-5xl text-left relative z-10">
          <FeatureCard
            icon={<QrCode className="w-8 h-8 text-cyan-400" />}
            title="Saniyeler İçinde QR Ödeme"
            desc="Müşterileriniz telefonlarındaki dinamik QR kodlarını okutarak anında puan kazanır veya harcar."
            delay={0.5}
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8 text-indigo-400" />}
            title="Detaylı Raporlama"
            desc="Hangi şubenizde ne kadar işlem yapılmış, en sadık müşterileriniz kimler tek ekranda görün."
            delay={0.6}
          />
          <FeatureCard
            icon={<ShieldCheck className="w-8 h-8 text-indigo-300" />}
            title="Güvenli ve Yetki Bazlı"
            desc="Kasiyer, yönetici ve patron rollerini ayrı ayrı tanımlayın. Herkes sadece görmesi gerekeni görsün."
            delay={0.7}
          />
        </div>

        {/* FAQ Section */}
        <div className="mt-32 w-full max-w-3xl relative z-10 text-left">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Sıkça Sorulan Sorular</h2>
            <p className="text-neutral-400">Okut Kazan hakkında merak ettikleriniz</p>
          </div>
          <div className="flex flex-col gap-4">
            <FAQItem
              question="Okut Kazan nedir?"
              answer="Okut Kazan, Kafe, Restoran, Perakende, Güzellik Merkezleri ve Kuaförler için tasarlanmış yeni nesil dijital sadakat kartı ve çok şubeli puan sistemidir."
            />
            <FAQItem
              question="Müşteriler nasıl puan kazanır? (Uygulama indirmeden)"
              answer="Müşteriler herhangi bir uygulama indirme zorunluluğu olmadan, doğrudan telefon kameralarıyla mağazadaki QR kodu okutarak saniyeler içinde puan kazanıp harcayabilirler."
            />
            <FAQItem
              question="Çok şubeli işletmeleri destekler mi?"
              answer="Evet, Şifrelenmiş multi-tenant veri izolasyon kalkanı sayesinde sınırsız şube ve yetki bazlı personel yönetimi desteklenir."
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-white/10 bg-white/5 rounded-2xl overflow-hidden backdrop-blur-md transition-colors hover:bg-white/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
      >
        <span className="font-semibold text-lg text-white">{question}</span>
        <ChevronDown className={`w-5 h-5 text-indigo-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-neutral-400">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-6 rounded-3xl border border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl group hover:border-indigo-500/30 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]"
      aria-label={`Özellik: ${title}`}
    >
      <div className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h2>
      <p className="text-neutral-400 leading-relaxed text-sm md:text-base">{desc}</p>
    </motion.div>
  );
}
