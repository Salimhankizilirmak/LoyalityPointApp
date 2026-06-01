"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Info, Clock, History, ArrowRight, AlertCircle } from "lucide-react";
import { CustomerData, TransactionData } from "../hooks/useCashierDashboard";

const TIER_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  Bronze: { bg: "bg-amber-500/10", color: "text-amber-400", border: "border-amber-500/20" },
  Silver: { bg: "bg-slate-500/10", color: "text-slate-400", border: "border-slate-500/20" },
  Gold: { bg: "bg-yellow-500/10", color: "text-yellow-400", border: "border-yellow-500/20" },
  Platinum: { bg: "bg-cyan-500/10", color: "text-cyan-400", border: "border-cyan-500/20" },
};

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

interface CustomerSearchPanelProps {
  customer: CustomerData | null;
  scanInput: string;
  setScanInput: (val: string) => void;
  scanning: boolean;
  handleScan: (phone: string) => Promise<void>;
  reset: () => void;
  isDarkMode: boolean;
  lastTransaction: TransactionData | null;
  loading: boolean;
  onOpenHistoryModal: () => void;
  searchError: string;
}

export function CustomerSearchPanel({
  customer,
  scanInput,
  setScanInput,
  scanning,
  handleScan,
  reset,
  isDarkMode,
  lastTransaction,
  loading,
  onOpenHistoryModal,
  searchError,
}: CustomerSearchPanelProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (val: string) => {
    const numericVal = val.replace(/\D/g, "");
    if (numericVal.length <= 11) {
      setScanInput(numericVal);
    }
  };

  const isValidPhone = /^05\d{9}$/.test(scanInput);

  const cardClass = `backdrop-blur-md transition-all duration-300 rounded-3xl border shadow-xl relative overflow-hidden flex flex-col justify-between h-full ${
    isDarkMode
      ? "bg-slate-900/60 border-indigo-500/10"
      : "bg-white border-slate-200/85"
  }`;

  const formatCurrency = (amountInKurus: number | null) => {
    if (amountInKurus === null || amountInKurus === 0) return "—";
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amountInKurus / 100);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* ── 1. ÜST KISIM: ARAMA GİRDİSİ ── */}
      <div className={`${cardClass} p-4 flex-shrink-0 !h-auto`}>
        <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div className="space-y-0.5">
            <h2 className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? "text-cyan-400" : "text-cyan-600"}`}>
              Müşteri Sorgulama
            </h2>
            <p className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              11 haneli telefon numarasını girin.
            </p>
          </div>
          <div className="relative group w-64">
            <Search
              size={14}
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                isValidPhone ? "text-cyan-400" : "text-slate-500"
              }`}
            />
            <input
              ref={searchInputRef}
              type="text"
              inputMode="numeric"
              maxLength={11}
              value={scanInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isValidPhone) {
                  handleScan(scanInput);
                }
              }}
              placeholder="05XXXXXXXXX"
              className={`w-full pl-9 pr-20 py-2 border rounded-xl text-xs font-mono outline-none transition-all placeholder-slate-600 min-h-[38px] ${
                isDarkMode
                  ? "bg-[#09090b]/80 border-white/10 text-white focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500"
              }`}
            />
            <button
              onClick={() => handleScan(scanInput)}
              disabled={scanning || !isValidPhone}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg text-[10px] font-bold text-white transition-all min-h-[28px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: isValidPhone
                  ? "linear-gradient(to right, #0891b2, #10b981)"
                  : "#1e293b",
                border: isValidPhone
                  ? "1px solid rgba(255,255,255,0.1)"
                  : "1px solid transparent",
              }}
            >
              {scanning ? "..." : "Sorgula"}
            </button>
          </div>
        </div>
        {searchError && (
          <div className="mt-3 relative z-10 flex items-center gap-2 p-2 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 text-[10px] font-semibold">
            <AlertCircle size={12} className="shrink-0" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* ── 2. ALT KISIM: REAKTİF MÜŞTERİ PANELİ ── */}
      <div className="flex-grow min-h-0">
        <AnimatePresence mode="wait">
          {!customer ? (
            /* Jenerik Maskeli Rehber Uyarısı */
            <motion.div
              key="guide-mask"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`${cardClass} p-8 flex-grow flex flex-col items-center justify-center text-center gap-3 border-dashed`}
            >
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                <Info size={20} />
              </div>
              <div className="space-y-1">
                <h3 className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  Müşteri Profil Maskesi
                </h3>
                <p className="text-[11px] text-slate-500 max-w-[280px] leading-relaxed">
                  Lütfen müşteri bilgilerini görmek için sorgulama yapınız.
                </p>
              </div>
            </motion.div>
          ) : (
            /* Müşteri Profil Önizleme Kartı (Sağ tarafla milimetrik aynı boyutta) */
            <motion.div
              key="customer-preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`${cardClass} p-4 flex flex-col justify-between`}
            >
              <div className="absolute top-[-30%] right-[-30%] w-60 h-60 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

              {/* Üst Kısım: Müşteri Künyesi */}
              <div className="flex items-center justify-between gap-4 relative z-10 w-full flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-sm font-black text-white shadow-lg flex-shrink-0">
                    {customer.avatar}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className={`text-xs font-bold truncate ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                        {customer.name}
                      </h3>
                      <span className={`px-1 py-0.5 rounded text-[7px] font-black uppercase border shrink-0 ${TIER_COLORS[customer.tier].bg} ${TIER_COLORS[customer.tier].color} ${TIER_COLORS[customer.tier].border}`}>
                        {customer.tier}
                      </span>
                    </div>
                    <p className={`text-[9px] font-mono ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {customer.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 font-mono tracking-tight leading-none">
                      {fmt(customer.pts)}
                    </p>
                    <p className="text-[7px] text-slate-500 font-black uppercase tracking-widest font-mono">
                      Bakiye
                    </p>
                  </div>
                  <button
                    onClick={reset}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                      isDarkMode
                        ? "bg-white/[0.02] border-white/[0.05] hover:bg-red-500/10 hover:border-red-500/20 text-slate-400 hover:text-red-400"
                        : "bg-slate-50 border-slate-200 hover:bg-red-500/10 hover:border-red-500/20 text-slate-500 hover:text-red-500"
                    }`}
                    title="Müşteri Seçimini Kapat"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Orta Kısım: En Son Tekil İşlem (Last Single Transaction) */}
              <div className="flex-grow flex flex-col justify-center py-4 relative z-10">
                <div className="bg-slate-950/20 rounded-2xl border border-white/5 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-white/5">
                    <Clock size={12} className="text-cyan-400" />
                    <span className={`text-[9px] font-black uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      En Son Tekil İşlem
                    </span>
                  </div>

                  {loading ? (
                    <div className="py-2 text-center text-[10px] text-slate-500 font-mono">
                      Yükleniyor...
                    </div>
                  ) : lastTransaction ? (
                    <div className="flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            lastTransaction.status === "VOIDED" || lastTransaction.type === "VOID"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : lastTransaction.type === "EARN"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                          }`}>
                            {lastTransaction.status === "VOIDED" ? "İPTAL" : lastTransaction.type === "EARN" ? "Kazanım" : "Harcama"}
                          </span>
                          {lastTransaction.amountSpent !== null && lastTransaction.amountSpent > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatCurrency(lastTransaction.amountSpent)}
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                          {lastTransaction.createdAtFormatted}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className={`font-mono font-bold text-sm ${
                          lastTransaction.status === "VOIDED"
                            ? "text-slate-500 line-through"
                            : lastTransaction.type === "EARN"
                            ? "text-emerald-400"
                            : "text-cyan-400"
                        }`}>
                          {lastTransaction.pointsAmount > 0 ? `+${lastTransaction.pointsAmount}` : lastTransaction.pointsAmount} Pts
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-[10px] text-slate-500">
                      Müşteriye ait işlem kaydı bulunmamaktadır.
                    </div>
                  )}
                </div>
              </div>

              {/* Alt Kısım: İşlem Geçmişini Gör Butonu */}
              <div className="relative z-10 flex-shrink-0 pt-2 border-t border-white/5">
                <button
                  onClick={onOpenHistoryModal}
                  className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border min-h-[38px] ${
                    isDarkMode
                      ? "bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 text-indigo-300 shadow-[0_4px_15px_rgba(99,102,241,0.1)]"
                      : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                  }`}
                >
                  <History size={14} />
                  <span>[ İşlem Geçmişini Gör ]</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
