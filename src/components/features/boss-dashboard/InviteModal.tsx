"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, X, CheckCircle, AlertCircle } from "lucide-react";
import { inviteEmployee } from "@/app/boss-dashboard/actions";

interface InviteModalProps {
  onClose: () => void;
  branches: { id: number; name: string }[];
}

export function InviteModal({ onClose, branches }: InviteModalProps) {
  const [form, setForm] = useState({ name: "", email: "", role: "manager", branch: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const valid = form.name && form.email.includes("@") && form.branch;

  const handleSend = async () => {
    if (!valid) return;
    setSending(true);
    setError("");
    try {
      await inviteEmployee({
        name: form.name,
        email: form.email,
        role: form.role as "manager" | "cashier",
        branch: form.branch,
      });
      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Davet gönderilemedi";
      setError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="w-full max-w-md rounded-2xl p-6 bg-white"
        style={{ boxShadow: "0 24px 64px rgba(15,23,42,0.18)" }}>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <UserPlus size={16} className="text-blue-700" />
            </div>
            <div>
              <h3 className="text-slate-900 font-semibold text-sm">Yönetici / Kasiyer Davet Et</h3>
              <p className="text-slate-400 text-xs">Davet e-postası otomatik gönderilir</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100">
            <X size={14} className="text-slate-400" />
          </button>
        </div>

        {sent ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <p className="text-slate-900 font-semibold mb-1">Davet Gönderildi!</p>
            <p className="text-slate-500 text-sm">{form.email} adresine {form.role === "manager" ? "Şube Müdürü" : "Kasiyer"} daveti iletildi.</p>
            <button onClick={onClose} className="mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#1e3a8a" }}>Tamam</button>
          </motion.div>
        ) : (
          <>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-xs">{error}</p>
              </div>
            )}
            <div className="space-y-3 mb-5">
              {([{ key: "name", label: "Ad Soyad", placeholder: "Ahmet Yılmaz" }, { key: "email", label: "E-posta", placeholder: "ahmet@firma.com" }] as const).map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-slate-600 text-xs font-medium mb-1.5 block">{label}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-900 outline-none"
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 text-xs font-medium mb-1.5 block">Rol</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-900 outline-none"
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <option value="manager">Şube Müdürü</option>
                    <option value="cashier">Kasiyer</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 text-xs font-medium mb-1.5 block">Şube</label>
                  <select value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-900 outline-none"
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <option value="">Seçin</option>
                    {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 font-medium"
                style={{ border: "1px solid #e2e8f0" }}>İptal</button>
              <button disabled={!valid || sending} onClick={handleSend}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: valid && !sending ? "#1e3a8a" : "#cbd5e1" }}>
                {sending ? "Gönderiliyor..." : "Davet Gönder"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
