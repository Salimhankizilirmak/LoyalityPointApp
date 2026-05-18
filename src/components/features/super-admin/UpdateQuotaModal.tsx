"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Loader2, AlertCircle, Building2 } from "lucide-react";
import { updateBranchLimitAction } from "@/app/admin/actions";

interface UpdateQuotaModalProps {
  orgId: string;
  orgName: string;
  currentLimit: number;
  activeBranches: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function UpdateQuotaModal({
  orgId,
  orgName,
  currentLimit,
  activeBranches,
  onClose,
  onSuccess,
}: UpdateQuotaModalProps) {
  const [limit, setLimit] = useState<number | "">(currentLimit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (limit === "" || limit < 1) {
      setError("Lütfen geçerli bir limit (en az 1) giriniz.");
      return;
    }
    
    // UI tarafında koruma (Backend de ayrıca koruyor)
    if (limit < activeBranches) {
      setError(`Yeni limit, mevcut aktif şube sayısından (${activeBranches}) daha az olamaz.`);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await updateBranchLimitAction(orgId, limit);
      if (res && "error" in res && res.error) {
        setError(res.error);
        setSaving(false);
      } else {
        onSuccess();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.");
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050508]/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="w-full max-w-sm rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(34,211,238,0.05)] border border-white/5 bg-[#0a0a0f] glass-panel"
      >
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
              <Building2 size={16} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white tracking-tight">Kota Düzenle</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{orgName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6">
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Yeni Şube Kotası
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={limit}
                onChange={(e) => setLimit(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                className="w-full bg-[#050508] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-lg text-center"
                autoFocus
              />
            </div>
            <div className="flex justify-between items-center mt-3 text-xs">
              <span className="text-slate-500">Mevcut Kota: <strong className="text-white">{currentLimit}</strong></span>
              <span className="text-slate-500">Aktif Şube: <strong className="text-cyan-400">{activeBranches}</strong></span>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={saving || limit === "" || limit < 1}
            className="relative w-full h-11 flex items-center justify-center gap-2 rounded-xl text-white font-medium text-sm transition-all overflow-hidden bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>Kotayı Güncelle</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
