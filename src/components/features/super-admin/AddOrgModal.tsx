"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Mail, GitBranch, X, Plus, RefreshCw, Check, Zap } from "lucide-react";

interface AddOrgModalProps {
  onClose: () => void;
  onAdd: (form: { name: string; slug: string; email: string }) => void;
}

export function AddOrgModal({ onClose, onAdd }: AddOrgModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(2,6,23,0.85)", backdropFilter: "blur(10px)" }}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }} transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: "#0f172a", border: "1px solid rgba(34,211,238,0.15)" }}>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.25)" }}>
              <Building2 size={15} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Yeni Organizasyon</h3>
              <p className="text-slate-500 text-xs">Tenant provisioning</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors">
            <X size={14} className="text-slate-500" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {FIELDS.map(({ key, label, placeholder, icon: Icon, mono }) => (
            <div key={key}>
              <label className="text-slate-400 text-xs font-medium mb-1.5 flex items-center gap-1.5 block">
                <Icon size={11} className="text-slate-600" />{label}
              </label>
              <input
                value={form[key]}
                onChange={e => {
                  const val = key === "slug" ? handleSlug(e.target.value) : e.target.value;
                  if (key === "name") setForm(f => ({ ...f, name: e.target.value, slug: handleSlug(e.target.value) }));
                  else setForm(f => ({ ...f, [key]: val }));
                }}
                placeholder={placeholder}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none text-white placeholder-slate-600"
                style={{
                  fontFamily: mono ? "monospace" : "inherit",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${form[key] ? "rgba(34,211,238,0.25)" : "rgba(255,255,255,0.07)"}`,
                  caretColor: "#22d3ee",
                }}
              />
              {key === "slug" && form.slug && (
                <p className="text-slate-600 text-xs mt-1 font-mono">
                  loyaltycore.io/<span className="text-cyan-600">{form.slug}</span>
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl mb-5 flex items-start gap-2.5"
          style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)" }}>
          <Zap size={13} className="text-indigo-400 mt-0.5 flex-shrink-0" />
          <p className="text-slate-400 text-xs leading-relaxed">
            Organizasyon oluşturulduktan sonra patron e-postasına otomatik davet ve aktivasyon bağlantısı gönderilecektir.
          </p>
        </div>

        <button onClick={submit} disabled={!valid || loading || done}
          className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          style={{
            background: done ? "rgba(52,211,153,0.2)" : valid ? "linear-gradient(135deg,#0e7490,#22d3ee)" : "rgba(34,211,238,0.1)",
            color: done ? "#34d399" : valid ? "#0f172a" : "#475569",
            border: done ? "1px solid rgba(52,211,153,0.4)" : "none",
          }}>
          {loading ? <><RefreshCw size={14} className="animate-spin" /> Oluşturuluyor...</>
            : done ? <><Check size={14} /> Davet Gönderildi!</>
            : <><Plus size={14} /> Organizasyonu Oluştur ve Davet Gönder</>}
        </button>
      </motion.div>
    </motion.div>
  );
}
