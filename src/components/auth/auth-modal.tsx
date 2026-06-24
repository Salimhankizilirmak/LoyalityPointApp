"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { X, Phone, Lock, Sparkles, Shield, Trophy, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useSignIn, useSignUp, useAuth, useClerk } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "signin" | "signup";
}

const slides = [
  {
    icon: <Sparkles className="w-8 h-8 text-indigo-400" />,
    title: "Müşteriniz toplasın, işletmeniz kazansın",
    description: "Telefon numaranız ile anında kayıt olun, her alışverişinizde QR kodunuzu okutarak saniyeler içinde puan kazanın."
  },
  {
    icon: <Shield className="w-8 h-8 text-cyan-400" />,
    title: "Güvenli Veri İzolasyon Kalkanı",
    description: "Verileriniz işletmeler arası cross-tenant isolation standartlarıyla korunur. Güvenliğiniz bizim önceliğimizdir."
  },
  {
    icon: <Trophy className="w-8 h-8 text-amber-400" />,
    title: "Akıllı Liderlik Tablosu",
    description: "İşletmenizin en aktif müşterileri arasında yerinizi alın, sadakat seviyenizi yükselterek özel ödülleri kapın."
  }
];

export default function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const { isLoaded } = useAuth();
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const searchParams = useSearchParams();

  const setActive = clerk.setActive;

  const isSignInLoaded = isLoaded;
  const isSignUpLoaded = isLoaded;

  const [activeSlide, setActiveSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [currentMode, setCurrentMode] = useState<"signin" | "signup">(mode);

  // Form State'leri
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isPhoneInput, setIsPhoneInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Davet Onay State'leri
  const [isVerifyingInvite, setIsVerifyingInvite] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");

  // URL'deki Davet Parametreleri (Bilet)
  const invitationToken = searchParams.get("__clerk_ticket") ||
    searchParams.get("ticket") ||
    searchParams.get("__clerk_invitation_token");

  // Mode prop değiştiğinde iç durumu güncelle
  useEffect(() => {
    setCurrentMode(mode);
    setError(null);
  }, [mode]);

  // Mobil cihaz tespiti
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Slider Otomatik Akış (4 saniye)
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Otomatik Davet Tanımlama Motoru
  useEffect(() => {
    if (!isSignUpLoaded || !signUp || !isOpen) return;

    // Eğer signup modundaysak ve URL'de token varsa otomatik olarak davetiyeyi doğrula
    if (currentMode === "signup" && invitationToken) {
      const verifyInvite = async () => {
        setIsVerifyingInvite(true);
        setError(null);
        try {
          console.log("[AuthModal] 🎫 Verifying invitation ticket:", invitationToken);
          const result = await signUp.create({
            ticket: invitationToken as string,
          });

          if (result.error) {
            throw result.error;
          }

          console.log("[AuthModal] 🎫 Invitation verified successfully:", signUp);
          setInviteUsername(signUp.username || "");
        } catch (err: any) {
          console.error("[AuthModal] Davet doğrulama hatası:", err);
          setError("Davet kodu doğrulanamadı veya süresi dolmuş olabilir. Lütfen davet linkini kontrol edin.");
        } finally {
          setIsVerifyingInvite(false);
        }
      };

      verifyInvite();
    }
  }, [currentMode, invitationToken, isSignUpLoaded, signUp, isOpen]);

  // 3D Parallax/Tilt Efekti Değerleri
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-300, 300], [10, -10]);
  const rotateY = useTransform(x, [-400, 400], [-10, 10]);
  const transformX = useTransform(x, [-400, 400], [-30, 30]);
  const transformY = useTransform(y, [-300, 300], [-30, 30]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    // Kartın merkezine göre fare koordinatları
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Akıllı Telefon Numarası Maskesi (Sadece Telefon Odaklı)
  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    setError(null);

    if (value === "") {
      setIdentifier("");
      setIsPhoneInput(false);
      return;
    }

    setIsPhoneInput(true);
    let digits = value.replace(/\D/g, "");

    if (digits.startsWith("0")) {
      digits = digits.substring(1);
    }

    if (digits.length > 10) {
      digits = digits.substring(0, 10);
    }

    let masked = "";
    if (digits.length > 0) {
      masked += "(" + digits.substring(0, Math.min(digits.length, 3));
    }
    if (digits.length > 3) {
      masked += ") " + digits.substring(3, Math.min(digits.length, 6));
    }
    if (digits.length > 6) {
      masked += " " + digits.substring(6, Math.min(digits.length, 8));
    }
    if (digits.length > 8) {
      masked += " " + digits.substring(8, Math.min(digits.length, 10));
    }
    setIdentifier(masked);
  };

  // Custom Clerk Sign-In Akışı (Giriş Yap Form Submit)
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignInLoaded) return;

    if (!identifier.trim() || !password.trim()) {
      setError("Lütfen tüm alanları doldurunuz.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let finalIdentifier = "";
      const cleanInput = identifier.replace(/[\s()\-]/g, "");

      if (/^5\d{9}$/.test(cleanInput)) {
        finalIdentifier = "+90" + cleanInput; // Uluslararası format mühürleme
      }
      else {
        throw new Error("Lütfen geçerli bir 10 haneli telefon numarası giriniz.");
      }

      const result = await signIn.create({
        identifier: finalIdentifier,
        password,
      });

      if (result.error) {
        throw result.error;
      }

      if (signIn.status === "complete") {
        await setActive({ session: signIn.createdSessionId });
        onClose();
      } else {
        throw new Error("Giriş işlemi tamamlanamadı. Lütfen bilgilerinizi kontrol edin.");
      }
    } catch (err: any) {
      console.error("[AuthModal] Giriş hatası:", err);
      let customError = "Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.";
      if (err.errors && err.errors.length > 0) {
        const clerkError = err.errors[0];
        if (clerkError.code === "form_password_incorrect") {
          customError = "Girdiğiniz şifre hatalıdır. Lütfen şifrenizi kontrol edin.";
        } else if (clerkError.code === "form_identifier_not_found") {
          customError = "Bu telefon numarası veya e-posta adresi ile kayıtlı kullanıcı bulunamadı.";
        } else if (clerkError.message) {
          customError = clerkError.message;
        }
      } else if (err instanceof Error) {
        customError = err.message;
      }
      setError(customError);
    } finally {
      setIsLoading(false);
    }
  };

  // Custom Clerk Sign-Up Akışı (Davet Onay Form Submit)
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUpLoaded || !signUp) return;

    if (!password.trim()) {
      setError("Lütfen şifrenizi belirleyin.");
      return;
    }

    if (password.length < 8) {
      setError("Belirleyeceğiniz şifre en az 8 karakter uzunluğunda olmalıdır.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await signUp.password({
        password,
      });

      if (result.error) {
        throw result.error;
      }

      if (signUp.status === "complete") {
        await setActive({ session: signUp.createdSessionId });
        onClose();
      } else {
        throw new Error("Kayıt işlemi tamamlanamadı. Lütfen bilgilerinizi kontrol edin.");
      }
    } catch (err: any) {
      console.error("[AuthModal] Kayıt hatası:", err);
      let customError = "Kayıt işlemi sırasında bir hata oluştu.";
      if (err.errors && err.errors.length > 0) {
        const clerkError = err.errors[0];
        if (clerkError.code === "password_validation_failed") {
          customError = "Şifreniz güvenlik kriterlerini karşılamıyor (en az 8 karakter, harf ve rakam içermelidir).";
        } else if (clerkError.message) {
          customError = clerkError.message;
        }
      } else if (err instanceof Error) {
        customError = err.message;
      }
      setError(customError);
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth ile Giriş Yap
  const handleGoogleSignIn = async () => {
    if (!clerk.client) return;
    setIsLoading(true);
    setError(null);

    try {
      await clerk.client.signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: any) {
      console.error("[AuthModal] Google Giriş Hatası:", err);
      setError(err.message || "Google ile giriş yapılırken bir hata oluştu.");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Arka Plan Overlay (Backdrop Blur) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md cursor-pointer"
        />

        {/* Neon Işık Efektleri (Parallax ile Hareket Eden) */}
        <motion.div
          style={{
            x: isMobile ? 0 : transformX,
            y: isMobile ? 0 : transformY,
          }}
          className="absolute w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none z-0"
        />

        {/* Modal Gövdesi (Cam Kart Konsepti) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX: isMobile ? 0 : rotateX,
            rotateY: isMobile ? 0 : rotateY,
            transformStyle: "preserve-3d",
          }}
          className="relative z-10 w-full max-w-4xl min-h-[550px] bg-neutral-900/60 border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl backdrop-blur-xl"
        >
          {/* Kapatma Butonu */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-white/70 hover:text-white z-50 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>

          {/* SOL TARAF: Sinematik Slayt Gösterisi (Avantajlar) */}
          <div className="md:w-1/2 p-12 bg-gradient-to-br from-indigo-950/40 via-neutral-950/20 to-transparent flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 relative">
            <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-cyan-500 flex items-center justify-center">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                LoyaltyPoints
              </span>
            </div>

            <div className="relative z-10 my-auto py-12 md:py-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    {slides[activeSlide].icon}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-white tracking-tight leading-snug">
                      {slides[activeSlide].title}
                    </h3>
                    <p className="text-neutral-400 text-sm leading-relaxed max-w-sm">
                      {slides[activeSlide].description}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative z-10 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${index === activeSlide ? "w-6 bg-indigo-400" : "w-1.5 bg-white/20"
                    }`}
                  aria-label={`Slayt ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* SAĞ TARAF: Form Alanı */}
          <div
            style={{ transform: "translateZ(30px)" }}
            className="md:w-1/2 p-12 flex flex-col justify-center relative z-10"
          >
            {/* Hata Mesajı Gösterimi (Global) */}
            {error && currentMode === "signup" && !invitationToken && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-3 mb-6"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </motion.div>
            )}

            {currentMode === "signin" ? (
              // 1. GİRİŞ YAP FORMU
              <form onSubmit={handleSignInSubmit} className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tight">Hoş Geldiniz</h2>
                  <p className="text-neutral-400 text-sm">
                    Sadakat programınıza erişmek için bilgilerinizi girin.
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest block">
                      Telefon Numarası
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={handleIdentifierChange}
                        placeholder="(5XX) XXX XX XX"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest block">
                      Şifre
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white py-4 rounded-2xl font-bold text-sm tracking-widest uppercase hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Giriş Yap
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink mx-4 text-neutral-500 text-xs font-bold uppercase tracking-wider">veya</span>
                    <div className="flex-grow border-t border-white/10"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    Google ile Giriş Yap
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setCurrentMode("signup"); setError(null); }}
                      className="text-neutral-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Hesap oluşturmak mı istiyorsunuz?
                    </button>
                  </div>
                </div>
              </form>
            ) : invitationToken ? (
              // 2. DAVET ONAY FORMU (KAYIT OL)
              <form onSubmit={handleSignUpSubmit} className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tight">Hesap Aktivasyonu</h2>
                  <p className="text-neutral-400 text-sm">
                    Size özel gönderilen davetiyeyi şifrenizi belirleyerek onaylayın.
                  </p>
                </div>

                {isVerifyingInvite ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="text-neutral-400 text-sm font-medium">Davet bilgileri doğrulanıyor...</p>
                  </div>
                ) : (
                  <>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-3"
                      >
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{error}</span>
                      </motion.div>
                    )}

                    <div className="space-y-4">
                      {/* Sistem Kullanıcı Adı Neon Bilgi Kartı */}
                      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 space-y-2">
                        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px]">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                          🏷️ Sistem Kullanıcı Adınız:
                        </div>
                        <div className="font-mono text-white text-sm bg-neutral-950/40 p-2.5 rounded-lg border border-white/5 select-all">
                          {inviteUsername ? inviteUsername.replace(/^u0?/, "") : "Davet Doğrulanıyor..."}
                        </div>
                        <p className="text-[10px] text-neutral-400 leading-normal">
                          *(Giriş yaparken telefon numaranızı yazmanız yeterlidir.)*
                        </p>
                      </div>

                      {/* Şifre Belirleme Alanı */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest block">
                          Yeni Şifrenizi Belirleyin
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(null); }}
                            placeholder="Min 8 karakter, harf ve rakam"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <button
                        type="submit"
                        disabled={isLoading || isVerifyingInvite}
                        className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white py-4 rounded-2xl font-bold text-sm tracking-widest uppercase hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            Aktivasyonu Tamamla
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => { setCurrentMode("signin"); setError(null); }}
                          className="text-neutral-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Giriş sayfasına geri dön
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </form>
            ) : (
              // 3. KAYIT KAPALI EKRANI (Davetiye Yoksa)
              <div className="space-y-8 text-center md:text-left">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tight">Kayıt Kapalı</h2>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    Sisteme üye kaydı yalnızca yetkili yöneticiler tarafından gönderilen **e-posta davetiyeleri** aracılığıyla gerçekleştirilebilmektedir.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-left flex items-start gap-4">
                  <Shield className="w-8 h-8 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-white text-xs font-bold uppercase tracking-wider">Davet Bekliyor musunuz?</h4>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">
                      Lütfen e-posta kutunuzun gelen ve spam klasörlerini kontrol edin. Davet linkine tıklayarak sistem tarafından tanınmış davet kodunuzla kaydınızı saniyeler içinde tamamlayabilirsiniz.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => { setCurrentMode("signin"); setError(null); }}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors text-xs font-black uppercase tracking-widest cursor-pointer"
                  >
                    Zaten hesabınız var mı? Giriş Yapın
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
