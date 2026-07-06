"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Gift, RefreshCw, Calendar, Award } from "lucide-react";
import { CustomerData, TransactionData } from "../hooks/useCashierDashboard";

interface CustomerQuickAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerData | null;
  transactions: TransactionData[];
  loading: boolean;
  isDarkMode: boolean;
}

const TIER_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  Bronze: { bg: "bg-amber-500/10", color: "text-amber-400", border: "border-amber-500/20" },
  Silver: { bg: "bg-slate-500/10", color: "text-slate-400", border: "border-slate-500/20" },
  Gold: { bg: "bg-yellow-500/10", color: "text-yellow-400", border: "border-yellow-500/20" },
  Platinum: { bg: "bg-cyan-500/10", color: "text-cyan-400", border: "border-cyan-500/20" },
};

export function CustomerQuickAuditModal({
  isOpen,
  onClose,
  customer,
  transactions,
  loading,
  isDarkMode,
}: CustomerQuickAuditModalProps) {
  if (!customer) return null;

  const fmtCurrency = (val: number | null) => {
    if (val === null || val === 0) return "—";
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val / 100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Arka Plan Glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Modal Gövdesi: Neon Indigo/Cyan Glassmorphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className={`w-full max-w-lg rounded-[2.5rem] p-6 relative overflow-hidden border shadow-2xl z-10 transition-colors duration-300 ${
              isDarkMode
                ? "bg-indigo-950/90 border-cyan-500/35 shadow-[0_0_50px_rgba(6,182,212,0.15)] text-slate-100"
                : "bg-white border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-slate-800"
            }`}
          >
            {/* Arka Plan Işık Efekti (Neon Glow - Purple Ban Uyumlu) */}
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

            {/* Kapatma Butonu */}
            <button
              onClick={onClose}
              className={`absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer hover:rotate-90 ${
                isDarkMode
                  ? "bg-white/5 border-white/10 hover:bg-white/10 text-slate-400"
                  : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600"
              }`}
            >
              <X size={16} />
            </button>

            {/* Başlık */}
            <div className="mb-5 space-y-0.5">
              <h3 className="text-[12px] font-black uppercase tracking-widest text-cyan-400">Müşteri İşlem Analizi</h3>
              <h3 className="text-[12px] font-bold tracking-tight">Sadakat Kart Geçmişi</h3>
            </div>

            {/* Müşteri Özet Kartı */}
            <div
              className={`rounded-2xl p-4 border flex items-center justify-between gap-4 mb-6 ${
                isDarkMode ? "bg-slate-950/60 border-cyan-500/10" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-md font-black text-white shadow-lg">
                  {customer.avatar}
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-[12px] leading-none flex items-center gap-2">
                    {customer.name}
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        TIER_COLORS[customer.tier].bg
                      } ${TIER_COLORS[customer.tier].color} ${TIER_COLORS[customer.tier].border}`}
                    >
                      {customer.tier}
                    </span>
                  </h3>
                  <p className="text-[10px] font-mono text-slate-500">{customer.phone}</p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <Calendar size={12} className="text-cyan-500" />
                  <span>Kayıt: {customer.createdAt || "Bilinmiyor"}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Award size={14} className="text-cyan-400" />
                  <span className="text-md font-black font-mono text-cyan-400">
                    {new Intl.NumberFormat("tr-TR").format(customer.pts)} Puan
                  </span>
                </div>
              </div>
            </div>

            {/* İşlem Listesi */}
            <div className="space-y-3">
              <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-500">Son 5 İşlem Kaydı</h3>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Veriler Getiriliyor...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-[10px] font-bold uppercase tracking-wider border border-dashed border-white/5 rounded-2xl">
                  Henüz bir işlem kaydı bulunmamaktadır.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {transactions.map((tx) => {
                    const isVoided = tx.status === "VOIDED";
                    const isVoidRecord = tx.type === "VOID";
                    const isEarn = tx.type === "EARN";

                    return (
                      <div
                        key={tx.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          isVoided
                            ? "bg-slate-950/20 opacity-50 border-red-500/10 line-through decoration-red-500/40"
                            : isDarkMode
                            ? "bg-slate-950/30 border-white/5 hover:border-cyan-500/25"
                            : "bg-slate-50 border-slate-200 hover:border-cyan-500/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isVoided || isVoidRecord
                                ? "bg-red-500/10 text-red-400"
                                : isEarn
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {isVoided || isVoidRecord ? (
                              <RefreshCw size={14} />
                            ) : isEarn ? (
                              <Star size={14} />
                            ) : (
                              <Gift size={14} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold">
                                {isVoided
                                  ? "İptal Edildi (Voided)"
                                  : isVoidRecord
                                  ? "Ters Kayıt (Void)"
                                  : isEarn
                                  ? "Puan Yükleme"
                                  : "Puan Harcama"}
                              </span>
                              {isVoided && (
                                <span className="px-1.5 py-0.5 rounded bg-red-500/25 text-[10px] font-black uppercase text-red-400">
                                  İptal
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{tx.createdAtFormatted}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p
                            className={`text-[10px] font-mono font-black ${
                              isVoided || isVoidRecord
                                ? "text-red-400"
                                : isEarn
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            {isEarn ? "+" : ""}
                            {tx.pointsAmount} Pts
                          </p>
                          {tx.amountSpent && tx.amountSpent > 0 ? (
                            <p className="text-[10px] text-slate-500 font-mono font-medium">
                              {fmtCurrency(tx.amountSpent)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
