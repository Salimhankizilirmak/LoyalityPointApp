"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, UserPlus, Phone, User, CheckCircle, AlertCircle } from "lucide-react";

interface AddCustomerModalProps {
  onClose: () => void;
  onAdd: (data: { firstName: string; lastName: string; phone: string }) => Promise<void>;
  isDarkMode: boolean;
}

export function AddCustomerModal({ onClose, onAdd, isDarkMode }: AddCustomerModalProps) {
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Phone validation: must be digits, start with 05, and be 11 digits long
  const isPhoneValid = form.phone.startsWith("05") && form.phone.length === 11 && /^\d+$/.test(form.phone);
  const valid = form.firstName && form.lastName && isPhoneValid;

  const handlePhoneChange = (val: string) => {
    // Only allow numbers
    const onlyNums = val.replace(/[^0-9]/g, '');
    if (onlyNums.length <= 11) {
      setForm(f => ({ ...f, phone: onlyNums }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    try {
      await onAdd(form);
      setDone(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"
          }`}
      >
        <div className={`px-6 py-4 flex items-center justify-between border-b ${isDarkMode ? "border-slate-700" : "border-slate-50"
          }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <UserPlus size={18} className="text-purple-500" />
            </div>
            <h3 className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>Müşteri Kaydet</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {done ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <p className={`font-bold mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Müşteri Kaydedildi</p>
              <p className="text-slate-500 text-xs">Puan sistemi aktif hale getirildi.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1 block">Ad</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      placeholder="Adınızı Giriniz"
                      className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all ${isDarkMode ? "bg-[#0a0f1e] border-slate-700 text-white focus:border-purple-500" : "bg-slate-50 border-slate-200 focus:border-purple-400 text-black"
                        }`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1 block">Soyad</label>
                  <input
                    required
                    value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="Soyadınızı Giriniz"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all ${isDarkMode ? "bg-[#0a0f1e] border-slate-700 text-white focus:border-purple-500" : "bg-slate-50 border-slate-200 focus:border-purple-400 text-black"
                      }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1 block">Telefon</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    type="tel"
                    value={form.phone} onChange={e => handlePhoneChange(e.target.value)}
                    placeholder="05xx xxx xx xx"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all ${
                      form.phone.length > 0 && !isPhoneValid 
                        ? "border-rose-500 bg-rose-500/5 focus:border-rose-500" 
                        : isDarkMode ? "bg-[#0a0f1e] border-slate-700 text-white focus:border-purple-500" : "bg-slate-50 border-slate-200 focus:border-purple-400 text-black"
                    }`}
                  />
                </div>
                {form.phone.length > 0 && !isPhoneValid && (
                  <div className="flex items-center gap-1.5 mt-1.5 ml-1 text-rose-500">
                    <AlertCircle size={12} />
                    <span className="text-[10px] font-bold">Numara 05 ile başlamalı ve 11 haneli olmalıdır.</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!valid || loading}
                className={`w-full py-4 rounded-2xl text-sm font-bold text-white shadow-lg transition-all ${valid && !loading ? "bg-purple-600 shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98]" : "bg-slate-300 cursor-not-allowed opacity-50"
                  }`}
              >
                {loading ? "Kaydediliyor..." : "Müşteriyi Kaydet"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
