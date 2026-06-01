"use client";

import React, { useActionState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserCircle2, AlertTriangle, Loader2 } from "lucide-react";

interface UsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  saveAction: (prevState: unknown, formData: FormData) => Promise<{ success: boolean; error?: string }>;
}

export function UsernameWarningModal({ isOpen, onClose, saveAction }: UsernameModalProps) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      const res = await saveAction(prevState, formData);
      if (res.success) {
        onClose();
        router.refresh();
      }
      return res;
    },
    { success: false, error: "" }
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md rounded-3xl border overflow-hidden shadow-2xl bg-[#0a0a0f]/90 border-cyan-500/20 shadow-cyan-500/5 text-white p-8 z-10 hover:border-cyan-500/35 transition-all duration-300"
          >
            {/* Ambient neon radial gradients */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
              aria-label="Kapat"
            >
              <X size={18} />
            </button>

            {/* Icon / Emblem */}
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10 text-cyan-400 shrink-0">
                <UserCircle2 size={24} className="animate-pulse" />
              </div>
            </div>

            {/* Title & Desc */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">
                Kullanıcı Adı Belirleyin
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mt-2.5 px-1">
                Sisteme diğer cihazlardan e-posta onayı gerekmeden, sadece kullanıcı adınız ve şifrenizle anında giriş yapabilmek için kurumsal bir kullanıcı adı tanımlayın.
              </p>
            </div>

            {/* Form */}
            <form action={formAction} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="username" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 pl-0.5">
                  Kullanıcı Adı
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400/60 group-focus-within:text-cyan-400 transition-colors">
                    <span className="text-sm font-semibold">@</span>
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    required
                    placeholder="isletmeadi"
                    disabled={isPending}
                    className="block w-full pl-9 pr-4 py-3 bg-[#09090b]/80 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all duration-200"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed pl-0.5">
                  Sadece küçük harf, rakam, nokta (.) ve alt çizgi (_) kullanabilirsiniz (En az 3 karakter).
                </p>
              </div>

              {/* Error Message */}
              {state?.error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-950/20 border border-red-900/50 rounded-2xl text-xs text-red-400 animate-in fade-in duration-200">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-500" />
                  <span className="leading-relaxed">{state.error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-500/10 hover:shadow-cyan-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer border border-indigo-400/20"
              >
                {isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin text-white" />
                    <span>Kaydediliyor...</span>
                  </div>
                ) : (
                  <span>Kullanıcı Adını Kaydet</span>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
