"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, X, CheckCircle, Send, AlertCircle } from "lucide-react";
import { inviteBossAction } from "@/app/admin/actions";

interface InviteBossModalProps {
  onClose: () => void;
  isDarkMode: boolean;
}

export function InviteBossModal({ onClose, isDarkMode }: InviteBossModalProps) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    setSending(true);
    setError("");
    
    const result = await inviteBossAction(email);
    
    if (result && typeof result === 'object' && 'success' in result && result.success) {
      setSent(true);
    } else {
      setError((result && typeof result === 'object' && 'error' in result ? (result as { error: string }).error : null) || "Bir hata oluştu.");
      setSending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border transition-colors duration-300 ${
          isDarkMode ? "bg-slate-900 border-slate-800 shadow-cyan-500/5" : "bg-white border-slate-100 shadow-slate-200"
        }`}
      >
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isDarkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-50 bg-slate-50/30"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode ? "bg-cyan-500/20" : "bg-cyan-50"}`}>
              <Send size={18} className="text-cyan-500" />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>Patron Davet Et</h3>
              <p className={`text-[10px] font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Uygulama düzeyinde yeni patron atayın</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${
            isDarkMode ? "hover:bg-slate-800 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          }`}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <p className={`font-bold mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Davet Gönderildi!</p>
              <p className={`text-xs px-8 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                {email} adresine sisteme giriş daveti başarıyla iletildi.
              </p>
              <button onClick={onClose} className={`mt-8 w-full py-3 rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-95 ${
                isDarkMode ? "bg-white text-slate-900 hover:bg-slate-100" : "bg-slate-900 text-white hover:bg-slate-800"
              }`}>Kapat</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-bold">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div>
                <label htmlFor="bossEmail" className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1 block ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Patron E-posta Adresi *
                </label>
                <div className="relative">
                  <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                  <input 
                    id="bossEmail"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ornek@sirket.com"
                    required
                    className={`w-full px-4 py-3 pl-10 rounded-2xl text-sm border outline-none transition-all min-h-[44px] ${
                      isDarkMode 
                        ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:bg-slate-900" 
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-400 focus:bg-white"
                    }`}
                  />
                </div>
              </div>

              <div className="bg-cyan-500/5 rounded-2xl p-4 border border-cyan-500/10">
                <p className={`text-[11px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  <span className="font-bold text-cyan-500">Not:</span> Davet edilen patron, e-postasını onayladıktan sonra kendi şifresini belirleyecek ve sisteme giriş yaptığında kendi organizasyonunu kuracaktır.
                </p>
              </div>

              <button 
                type="submit"
                disabled={sending} 
                className={`w-full py-4 rounded-2xl text-sm font-bold text-white shadow-lg transition-all min-h-[44px] ${
                  !sending 
                    ? "bg-cyan-600 shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] hover:bg-cyan-500" 
                    : "bg-slate-300 cursor-not-allowed opacity-50"
                }`}
              >
                {sending ? "Davet Gönderiliyor..." : "Patron Davet Et"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
