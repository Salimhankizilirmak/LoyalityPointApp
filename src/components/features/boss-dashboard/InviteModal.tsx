"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, X, CheckCircle, AlertCircle, Mail, ShieldAlert } from "lucide-react";
import { inviteEmployee } from "@/app/boss-dashboard/actions";
import { useUser } from "@clerk/nextjs";

interface InviteModalProps {
  onClose: () => void;
  branches: { id: number; name: string }[];
  isDarkMode: boolean;
  fixedRole?: "manager" | "cashier";
}

const FORBIDDEN_EMAILS = ["superadmin@loyaltycore.io", "admin@loyalty.io"];

export function InviteModal({ onClose, branches, isDarkMode, fixedRole }: InviteModalProps) {
  const { user } = useUser();
  const bossEmail = user?.primaryEmailAddress?.emailAddress;

  const [form, setForm] = useState({ name: "", email: "", role: fixedRole || "cashier", branch: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const emailLower = form.email.toLowerCase().trim();
  const isForbidden = FORBIDDEN_EMAILS.includes(emailLower) || emailLower === bossEmail?.toLowerCase();
  
  const valid = form.name.trim() !== "" && form.email.includes("@") && !isForbidden;

  const handleSend = async () => {
    if (!valid) return;
    setSending(true);
    setError("");
    
    // Seçilen şubenin ID'sini bul
    const selectedBranch = branches.find(b => b.name === form.branch);
    
    try {
      await inviteEmployee({
        name: form.name,
        email: form.email,
        role: form.role as "manager" | "cashier",
        branch: form.branch || "Atanmadı",
        org_id: selectedBranch ? String(selectedBranch.id) : undefined
      });
      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Davet gönderilemedi";
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const inputClasses = `w-full px-4 py-3 rounded-2xl text-sm border outline-none transition-all ${
    isDarkMode 
      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-900" 
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:bg-white"
  }`;

  const labelClasses = `text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1 block ${
    isDarkMode ? "text-slate-400" : "text-slate-500"
  }`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border transition-colors duration-300 ${
          isDarkMode ? "bg-slate-900 border-slate-800 shadow-blue-500/5" : "bg-white border-slate-100 shadow-slate-200"
        }`}
      >
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isDarkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-50 bg-slate-50/30"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode ? "bg-blue-500/20" : "bg-blue-50"}`}>
              <UserPlus size={18} className="text-blue-500" />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>Ekip Üyesi Davet Et</h3>
              <p className={`text-[10px] font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Yeni yönetici veya kasiyer atayın</p>
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
                {form.email} adresine {form.role === "manager" ? "Yönetici" : "Kasiyer"} daveti başarıyla iletildi.
              </p>
              <button onClick={onClose} className={`mt-8 w-full py-3 rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-95 ${
                isDarkMode ? "bg-white text-slate-900 hover:bg-slate-100" : "bg-slate-900 text-white hover:bg-slate-800"
              }`}>Kapat</button>
            </div>
          ) : (
            <div className="space-y-5">
              {isForbidden && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <ShieldAlert size={18} className="text-rose-500 flex-shrink-0" />
                  <p className="text-rose-500 text-[11px] font-bold leading-tight">
                    Bu e-posta adresi sistem yetkilisi veya kendi hesabınız olduğu için atama yapılamaz.
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[11px] font-bold">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={labelClasses}>Ad Soyad *</label>
                  <input 
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Örn: Ahmet Yılmaz"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={labelClasses}>E-posta Adresi *</label>
                  <div className="relative">
                    <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <input 
                      value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="eposta@adres.com"
                      className={`${inputClasses} pl-10 ${isForbidden ? "border-rose-500 bg-rose-500/5 focus:border-rose-500" : ""}`}
                    />
                  </div>
                </div>

                {!fixedRole && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Rol (Opsiyonel)</label>
                      <div className="relative">
                        <select 
                          value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as "manager" | "cashier" }))}
                          className={`${inputClasses} appearance-none pr-10`}
                        >
                          <option value="cashier" className={isDarkMode ? "bg-slate-800" : "bg-white"}>Kasiyer</option>
                          <option value="manager" className={isDarkMode ? "bg-slate-800" : "bg-white"}>Şube Müdürü</option>
                        </select>
                        <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className={labelClasses}>Şube (Opsiyonel)</label>
                      <div className="relative">
                        <select 
                          value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
                          className={`${inputClasses} appearance-none pr-10`}
                        >
                          <option value="" className={isDarkMode ? "bg-slate-800" : "bg-white"}>Atama Yok</option>
                          {branches.map(b => <option key={b.id} value={b.name} className={isDarkMode ? "bg-slate-800" : "bg-white"}>{b.name}</option>)}
                        </select>
                        <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button 
                disabled={!valid || sending} 
                onClick={handleSend}
                className={`w-full py-4 rounded-2xl text-sm font-bold text-white shadow-lg transition-all ${
                  valid && !sending 
                    ? "bg-blue-600 shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] hover:bg-blue-500" 
                    : "bg-slate-300 cursor-not-allowed opacity-50"
                }`}
              >
                {sending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Gönderiliyor...</span>
                  </div>
                ) : "Daveti Tamamla"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
