"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, Clock, AlertCircle, TrendingUp, TrendingDown, RefreshCw, ChevronRight } from "lucide-react";
import { CustomerData, TransactionData } from "../hooks/useCashierDashboard";

interface CustomerTransactionsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerData | null;
  transactions: TransactionData[];
  loading: boolean;
  isDarkMode: boolean;
}

export function CustomerTransactionsHistoryModal({
  isOpen,
  onClose,
  customer,
  transactions,
  loading,
  isDarkMode,
}: CustomerTransactionsHistoryModalProps) {
  if (!customer) return null;

  const formatCurrency = (amountInKurus: number | null) => {
    if (amountInKurus === null || amountInKurus === 0) return "—";
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amountInKurus / 100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md pointer-events-auto"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className={`w-full max-w-lg rounded-3xl border p-5 relative overflow-hidden flex flex-col justify-between shadow-2xl transition-colors duration-300 max-h-[85vh] ${
              isDarkMode ? "bg-slate-900 border-indigo-500/20 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Arka Plan Parlaması (Cyan & Indigo neon) */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

            {/* Modal Başlık */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5 relative z-10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isDarkMode ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-slate-100 border-slate-200 text-slate-700"
                }`}>
                  <Clock size={16} />
                </div>
                <div>
                  <h3 className="text-[12px] font-black uppercase tracking-wider">İşlem Geçmişi (Son 10 Kayıt)</h3>
                  <p className="text-[10px] text-slate-500 font-mono truncate max-w-[280px]">
                    Müşteri: {customer.name} ({customer.phone})
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                  isDarkMode 
                    ? "bg-white/[0.02] border-white/[0.05] hover:bg-white/5 text-slate-400 hover:text-white" 
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500"
                }`}
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal İçerik (Kaydırılabilir Liste) */}
            <div className="flex-grow overflow-y-auto my-4 space-y-2 pr-1 relative z-10 scrollbar-none min-h-[250px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                  <p className="text-[10px] font-mono">İşlem geçmişi yükleniyor...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-center gap-2">
                  <AlertCircle size={24} className="text-slate-600" />
                  <p className="text-[10px] font-mono">Kayıtlı sadakat işlemi bulunmamaktadır.</p>
                </div>
              ) : (
                transactions.map((tx) => {
                  const isEarn = tx.type === "EARN";
                  const isVoid = tx.status === "VOIDED" || tx.type === "VOID";

                  return (
                    <div
                      key={tx.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isVoid
                          ? "bg-red-950/5 border-red-500/10 opacity-50 line-through"
                          : isEarn
                          ? "bg-white/5 border-white/5 hover:border-emerald-500/10 hover:bg-white/10"
                          : "bg-white/5 border-white/5 hover:border-cyan-500/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
                          isVoid
                            ? "bg-red-500/10 border-red-500/20 text-red-400"
                            : isEarn
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                        }`}>
                          {isVoid ? (
                            <AlertCircle size={14} />
                          ) : isEarn ? (
                            <TrendingUp size={14} />
                          ) : (
                            <TrendingDown size={14} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-black uppercase ${
                              isVoid ? "text-red-400" : isEarn ? "text-emerald-400" : "text-cyan-400"
                            }`}>
                              {isVoid ? "VOIDED" : isEarn ? "Kazanım" : "Harcama"}
                            </span>
                            {tx.amountSpent !== null && tx.amountSpent > 0 && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatCurrency(tx.amountSpent)}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {tx.createdAtFormatted}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-mono text-[10px] font-bold ${
                          isVoid ? "text-slate-500" : isEarn ? "text-emerald-400" : "text-cyan-400"
                        }`}>
                          {tx.pointsAmount > 0 ? `+${tx.pointsAmount}` : tx.pointsAmount} Pts
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Alt Kısım: Tüm Kayıtları Göster Butonu */}
            <div className="relative z-10 pt-3 border-t border-white/5 flex flex-col items-center justify-center flex-shrink-0">
              <Link
                href={`/cashier-dashboard/transactions?customerId=${customer.id}`}
                prefetch={true}
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 border border-indigo-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_4px_15px_rgba(99,102,241,0.25)] hover:scale-102"
              >
                <span>[ Tüm Kayıtları Göster ]</span>
                <ChevronRight size={12} />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
