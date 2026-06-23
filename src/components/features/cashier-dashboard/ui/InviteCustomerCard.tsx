"use client";

import { motion } from "framer-motion";
import { UserPlus, Loader2 } from "lucide-react";

interface InviteCustomerCardProps {
  form: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  setField: (field: "firstName" | "lastName" | "phone" | "email", value: string) => void;
  isFormValid: boolean;
  isEmailValid: boolean;
  submitting: boolean;
  onSubmit: () => Promise<void>;
  isDarkMode: boolean;
}

export function InviteCustomerCard({
  form,
  setField,
  isFormValid,
  isEmailValid,
  submitting,
  onSubmit,
  isDarkMode,
}: InviteCustomerCardProps) {
  // Türkiye Telefon Kontrolü (05 ile başlayan 11 haneli)
  const handlePhoneChange = (val: string) => {
    let cleaned = val.replace(/\D/g, "");
    if (cleaned.startsWith("905")) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith("05")) {
      cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith("90") && cleaned.length > 2 && !cleaned.startsWith("905")) {
      cleaned = cleaned.replace(/^90+/, "");
    } else if (cleaned.startsWith("0") && cleaned.length > 1 && !cleaned.startsWith("05")) {
      cleaned = cleaned.replace(/^0+/, "");
    }
    if (cleaned.length > 0 && !cleaned.startsWith("5")) {
      const firstFiveIdx = cleaned.indexOf("5");
      if (firstFiveIdx !== -1) {
        cleaned = cleaned.substring(firstFiveIdx);
      } else {
        cleaned = "";
      }
    }
    setField("phone", cleaned.slice(0, 10));
  };

  const cardClass = `h-full backdrop-blur-md transition-colors duration-300 rounded-3xl p-4 relative overflow-hidden shadow-xl border flex flex-col justify-between ${isDarkMode
      ? "bg-slate-900/60 border-indigo-500/10"
      : "bg-white border-slate-200/85"
    }`;

  const inputClass = `w-full px-3 py-2 border rounded-xl text-xs font-mono outline-none transition-all min-h-[36px] ${isDarkMode
      ? "bg-[#09090b]/80 border-white/10 text-white placeholder-slate-600 focus:border-cyan-500 focus:shadow-[0_0_12px_rgba(6,182,212,0.15)]"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500"
    }`;

  const labelClass = `block text-[10px] font-black uppercase tracking-widest mb-1.5 ml-0.5 ${isDarkMode ? "text-slate-500" : "text-slate-600"
    }`;

  return (
    <div className={cardClass}>
      {/* Neon dekor */}
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none" />

      {/* Başlık */}
      <div className="flex items-center gap-2.5 mb-3 relative z-10 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
          <UserPlus size={14} className="text-cyan-400" />
        </div>
        <div>
          <h3 className={`text-xs font-bold tracking-tight ${isDarkMode ? "text-white" : "text-slate-800"}`}>
            Yeni Müşteri Davet Et
          </h3>
          <p className={`text-[9px] ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
            İlk kez gelen müşteriye e-posta ile davetiye gönderin.
          </p>
        </div>
      </div>

      {/* Form alanları - space-y-4 nizamıyla pikselsel olarak sıkıştırılmış */}
      <div className="space-y-4 relative z-10 flex-grow py-2">
        <div className="grid grid-cols-2 gap-3">
          {/* Ad */}
          <div>
            <label className={labelClass}>Ad</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setField("firstName", e.target.value)}
              placeholder="Adı"
              className={inputClass}
              autoComplete="given-name"
            />
          </div>

          {/* Soyad */}
          <div>
            <label className={labelClass}>Soyad</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setField("lastName", e.target.value)}
              placeholder="Soyadı"
              className={inputClass}
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Telefon */}
          <div>
            <label className={labelClass}>Telefon *</label>
            <div className="relative">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <span className={`text-[11px] font-bold border-r pr-1.5 ${isDarkMode ? "text-slate-400 border-slate-800" : "text-slate-500 border-slate-200"}`}>
                  +90
                </span>
              </div>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="5XX XXX XX XX"
                maxLength={10}
                required
                className={`${inputClass} pl-[36px]`}
                autoComplete="tel"
              />
            </div>
          </div>

          {/* E-posta */}
          <div>
            <label className={labelClass}>E-posta</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="novexitech@gmail.com"
              className={`${inputClass} ${form.email.length > 0 && !isEmailValid
                  ? isDarkMode
                    ? "border-rose-500/50"
                    : "border-rose-400"
                  : ""
                }`}
              autoComplete="email"
            />
          </div>
        </div>
      </div>

      {/* Davet Et Butonu */}
      <div className="relative z-10 pt-4 flex-shrink-0">
        <motion.button
          whileHover={isFormValid && !submitting ? { scale: 1.01 } : {}}
          whileTap={isFormValid && !submitting ? { scale: 0.98 } : {}}
          onClick={onSubmit}
          disabled={!isFormValid || submitting}
          className={`w-full py-2.5 rounded-xl font-bold text-xs text-white transition-all min-h-[38px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${isFormValid && !submitting
              ? "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-[0_4px_20px_rgba(8,145,178,0.2)]"
              : isDarkMode
                ? "bg-slate-800 text-slate-500 border border-white/5"
                : "bg-slate-200 text-slate-400 border border-slate-300"
            }`}
        >
          {submitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Davet Gönderiliyor...</span>
            </>
          ) : (
            <>
              <UserPlus size={14} />
              <span>[ Müşteriyi Davet Et ]</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
