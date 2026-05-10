"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Mail, GitBranch, X, Plus, RefreshCw, Check, Zap } from "lucide-react";

interface AddOrgModalProps {
  onClose: () => void;
  onAdd: (form: { name: string; slug: string; email: string }) => void;
  isDarkMode?: boolean;
}

export function AddOrgModal({ onClose, onAdd, isDarkMode = true }: AddOrgModalProps) {
  const [form, setForm] = useState({ name: "", slug: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const valid = form.name && form.slug && form.email.includes("@");

  const handleSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const submit = () => {
    if (!valid) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      setTimeout(() => { onAdd(form); onClose(); }, 1200);
    }, 1600);
  };

  const FIELDS = [
    { key: "name", label: "Şirket Adı", placeholder: "Örn: Migros Ticaret A.Ş.", icon: Building2, mono: false },
    { key: "slug", label: "URL Slug", placeholder: "ornek-sirket", icon: GitBranch, mono: true },
    { key: "email", label: "Patron E-postası", placeholder: "ceo@sirket.com", icon: Mail, mono: false },
  ] as const;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border transition-colors ${
          isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"
        }`}
      >
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isDarkMode ? "border-slate-800" : "border-slate-50"
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Building2 size={18} className="text-cyan-400" />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>Yeni Organizasyon</h3>
              <p className="text-slate-500 text-[10px]">Tenant provisioning system</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {FIELDS.map(({ key, label, placeholder, icon: Icon, mono }) => (
            <div key={key}>
              <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1 block">
                {label}
              </label>
              <div className="relative">
                <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={form[key]}
                  onChange={e => {
                    const val = key === "slug" ? handleSlug(e.target.value) : e.target.value;
                    if (key === "name") setForm(f => ({ ...f, name: e.target.value, slug: handleSlug(e.target.value) }));
                    else setForm(f => ({ ...f, [key]: val }));
                  }}
                  placeholder={placeholder}
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl text-sm border outline-none transition-all ${
                    isDarkMode ? "bg-[#0a0f1e] border-slate-700 text-white focus:border-cyan-500" : "bg-slate-50 border-slate-200 focus:border-cyan-400"
                  }`}
                  style={{ fontFamily: mono ? "monospace" : "inherit" }}
                />
              </div>
              {key === "slug" && form.slug && (
                <p className="text-cyan-600 text-[10px] mt-1 ml-1 font-bold">
                  loyaltycore.io/{form.slug}
                </p>
              )}
            </div>
          ))}

          <div className={`p-4 rounded-2xl flex items-start gap-3 transition-colors ${
            isDarkMode ? "bg-indigo-500/5 border border-indigo-500/10" : "bg-indigo-50 border border-indigo-100"
          }`}>
            <Zap size={14} className="text-indigo-400 mt-0.5 flex-shrink-0" />
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Organizasyon oluşturulduktan sonra patron e-postasına otomatik davet ve aktivasyon bağlantısı gönderilecektir.
            </p>
          </div>

          <button onClick={submit} disabled={!valid || loading || done}
            className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/10 ${
              done 
                ? "bg-emerald-500 text-white" 
                : valid 
                  ? "bg-cyan-600 text-white hover:scale-[1.01] active:scale-[0.99]" 
                  : "bg-slate-300 text-white cursor-not-allowed"
            }`}
          >
            {loading ? <><RefreshCw size={16} className="animate-spin" /> Oluşturuluyor...</>
              : done ? <><Check size={16} /> Davet Gönderildi!</>
              : <><Plus size={16} /> Organizasyonu Başlat</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
