"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Phone, CheckCircle, ArrowRight, ArrowLeft,
  Gift, Star, Shield, Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";

const BRAND = "#0891b2";
const BRAND_LIGHT = "#ecfeff";

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  gender: string;
  consent: boolean;
  marketingConsent: boolean;
}

const STEPS = [
  { id: 1, label: "Hoş Geldin", sub: "Hesabınızı kişiselleştirin" },
  { id: 2, label: "Kişisel Bilgiler", sub: "Ad, soyad ve iletişim" },
  { id: 3, label: "Tercihler", sub: "İletişim ve gizlilik ayarları" },
  { id: 4, label: "Hazır!", sub: "Sadakat programına katıldınız" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    firstName: "", lastName: "", phone: "", birthDate: "",
    gender: "", consent: false, marketingConsent: false,
  });

  const next = () => step < STEPS.length - 1 && setStep(s => s + 1);
  const prev = () => step > 0 && setStep(s => s - 1);

  const STEP_VALID = [
    true,
    form.firstName && form.lastName && form.phone.length >= 10,
    form.consent,
    true,
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(160deg,#ecfeff 0%,#cffafe 50%,#f0f9ff 100%)", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: BRAND, boxShadow: "0 8px 24px rgba(8,145,178,0.35)" }}>
          <Star size={20} className="text-white" />
        </div>
        <div>
          <p className="font-black text-xl text-slate-900 leading-none">LC Waikiki</p>
          <p className="text-slate-500 text-xs">Sadakat Programı</p>
        </div>
      </div>

      <div className="w-full max-w-sm">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <motion.div animate={{ background: i <= step ? BRAND : "#e2e8f0", scale: i === step ? 1.15 : 1 }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ color: i <= step ? "#fff" : "#94a3b8" }}>
                {i < step ? <CheckCircle size={14} className="text-white" /> : s.id}
              </motion.div>
              {i < STEPS.length - 1 && (
                <div className="w-6 h-0.5 rounded-full" style={{ background: i < step ? BRAND : "#e2e8f0" }} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 24px 64px rgba(8,145,178,0.12)", border: "1px solid rgba(165,243,252,0.3)" }}>
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>
              {/* Adım 0: Hoş Geldin */}
              {step === 0 && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center"
                    style={{ background: BRAND_LIGHT }}>
                    <Sparkles size={36} style={{ color: BRAND }} />
                  </div>
                  <div>
                    <h1 className="text-slate-900 font-black text-2xl mb-1">Hoş Geldiniz!</h1>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      LC Waikiki Sadakat Programı&apos;na katılarak her alışverişte puan kazanın ve özel ayrıcalıklardan yararlanın.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {[
                      { icon: Star, label: "Puan Kazan" },
                      { icon: Gift, label: "Teklifler" },
                      { icon: Shield, label: "Güvenli" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="p-3 rounded-2xl text-center" style={{ background: BRAND_LIGHT }}>
                        <Icon size={18} style={{ color: BRAND }} className="mx-auto mb-1.5" />
                        <p className="text-xs font-medium" style={{ color: BRAND }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Adım 1: Kişisel Bilgiler */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-slate-900 font-bold text-lg">Kişisel Bilgiler</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Bilgileriniz yalnızca sadakat programı için kullanılır.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(["firstName", "lastName"] as const).map((key, i) => (
                      <div key={key}>
                        <label htmlFor={key} className="text-slate-500 text-xs font-medium mb-1 block">{i === 0 ? "Ad" : "Soyad"}</label>
                        <input id={key} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                          placeholder={i === 0 ? "Fatma" : "Güler"}
                          className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-800 outline-none min-h-[44px]"
                          style={{ background: "#f8fafc", border: `1px solid ${form[key] ? "#a5f3fc" : "#e2e8f0"}` }} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label htmlFor="phone" className="text-slate-500 text-xs font-medium mb-1 block">Telefon Numarası</label>
                    <input id="phone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="0532 000 00 00"
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-800 outline-none min-h-[44px]"
                      style={{ background: "#f8fafc", border: `1px solid ${form.phone ? "#a5f3fc" : "#e2e8f0"}` }} />
                  </div>
                  <div>
                    <label htmlFor="birthDate" className="text-slate-500 text-xs font-medium mb-1 block">Doğum Tarihi <span className="text-slate-400">(Opsiyonel)</span></label>
                    <input id="birthDate" type="date" value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-800 outline-none min-h-[44px]"
                      style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }} />
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-medium mb-1.5 block">Cinsiyet <span className="text-slate-400">(Opsiyonel)</span></p>
                    <div className="flex gap-2">
                      {["Kadın", "Erkek", "Belirtmek İstemiyorum"].map(g => (
                        <button key={g} onClick={() => setForm(f => ({ ...f, gender: g }))}
                          className="flex-1 py-2 rounded-xl text-xs font-medium transition-all min-h-[44px]"
                          style={{
                            background: form.gender === g ? BRAND_LIGHT : "#f8fafc",
                            color: form.gender === g ? BRAND : "#64748b",
                            border: `1px solid ${form.gender === g ? "#a5f3fc" : "#e2e8f0"}`,
                          }}>
                          {g.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Adım 2: İzinler */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-slate-900 font-bold text-lg">Tercihler</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Gizlilik ve iletişim ayarlarınızı belirleyin.</p>
                  </div>
                  <div className="space-y-3">
                    {([
                      { key: "consent", label: "Kullanım Koşulları", desc: "Sadakat programı üyelik sözleşmesini okudum ve kabul ediyorum.", required: true },
                      { key: "marketingConsent", label: "Pazarlama İletişimi", desc: "Kampanya ve teklifler hakkında e-posta/SMS almak istiyorum.", required: false },
                    ] as const).map(({ key, label, desc, required }) => (
                      <div key={key} className="flex items-start gap-3 p-4 rounded-2xl"
                        style={{ border: `1px solid ${form[key] ? "#a5f3fc" : "#f1f5f9"}`, background: form[key] ? BRAND_LIGHT : "#f8fafc" }}>
                        <button onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                          aria-label={label}
                          className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5 min-h-[20px]"
                          style={{ background: form[key] ? BRAND : "#fff", border: `2px solid ${form[key] ? BRAND : "#d1d5db"}` }}>
                          {form[key] && <CheckCircle size={12} className="text-white" />}
                        </button>
                        <div>
                          <p className="text-slate-800 text-xs font-semibold">
                            {label} {required && <span className="text-red-500">*</span>}
                          </p>
                          <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-slate-400 text-xs text-center">
                    Kişisel verileriniz KVKK kapsamında korunmaktadır.
                  </p>
                </div>
              )}

              {/* Adım 3: Tamamlandı */}
              {step === 3 && (
                <div className="text-center py-4 space-y-5">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                    style={{ background: BRAND, boxShadow: "0 12px 32px rgba(8,145,178,0.4)" }}>
                    <CheckCircle size={40} className="text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-slate-900 font-black text-2xl mb-2">Tebrikler! 🎉</h2>
                    <p className="text-slate-500 text-sm">Sadakat programına başarıyla katıldınız.</p>
                  </div>
                  <div className="p-4 rounded-2xl" style={{ background: BRAND_LIGHT, border: "1px solid #a5f3fc" }}>
                    <p className="text-cyan-700 text-sm font-semibold mb-1">Hoş Geldin Bonusu</p>
                    <p className="text-4xl font-black" style={{ color: BRAND }}>500</p>
                    <p className="text-slate-500 text-xs">puan hesabınıza yüklendi!</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Nav Buttons */}
          <div className="flex items-center gap-3 mt-6">
            {step > 0 && step < 3 && (
              <button onClick={prev} className="w-11 h-11 rounded-xl flex items-center justify-center min-h-[44px]"
                aria-label="Geri Git"
                style={{ border: "1px solid #e2e8f0" }}>
                <ArrowLeft size={16} className="text-slate-500" />
              </button>
            )}
            <button onClick={step < 3 ? next : () => router.push("/customer-dashboard")}
              disabled={!STEP_VALID[step]}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 min-h-[44px]"
              style={{
                background: STEP_VALID[step] ? BRAND : "#e2e8f0",
                color: STEP_VALID[step] ? "#fff" : "#94a3b8",
                boxShadow: STEP_VALID[step] ? "0 4px 16px rgba(8,145,178,0.3)" : "none",
              }}>
              {step < 3 ? "Devam Et" : "Panele Git"} <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
