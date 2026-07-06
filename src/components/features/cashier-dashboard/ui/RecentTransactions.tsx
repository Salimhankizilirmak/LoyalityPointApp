"use client";

import React, { useEffect, useState, useCallback } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { getRecentBranchTransactionsAction, voidTransactionAction } from "@/app/(cashier)/cashier-dashboard/actions";
import { History, RefreshCw, Star, Gift, Clock, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";


interface RecentTransactionsProps {
  refreshTrigger?: number;
}

export interface RecentTxRow {
  id: string;
  organizationId: string;
  branchId: string;
  customerId: string;
  cashierId: string;
  type: "EARN" | "BURN" | "VOID";
  amountSpent: number | null;
  pointsAmount: number;
  createdAtFormatted: string;
  customerName: string;
  customerPhone: string;
  cashierName: string;
  status: "SUCCESS" | "VOIDED";
  parentTransactionId?: string | null;
}

export function RecentTransactions({ refreshTrigger }: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<Array<RecentTxRow>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [voidingId, setVoidingId] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getRecentBranchTransactionsAction(5, page);
      if (res.success && res.transactions) {
        setTransactions(res.transactions as RecentTxRow[]);
      } else {
        setError(res.error || "İşlemler listelenirken hata oluştu.");
      }
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTransactions();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshTrigger, loadTransactions, page]);

  const handleVoid = async (txId: string) => {
    if (!window.confirm("Bu işlemi iptal etmek (Void) istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
      return;
    }
    setVoidingId(txId);
    setError("");
    try {
      const res = await voidTransactionAction(txId);
      if (res.success) {
        await loadTransactions();
      } else {
        setError(res.error || "İptal işlemi gerçekleştirilemedi.");
      }
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setVoidingId(null);
    }
  };

  const formatCurrency = (amountInKurus: number | null) => {
    if (amountInKurus === null || amountInKurus === 0) return "—";
    const amount = amountInKurus / 100;
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);
  };

  return (
    <GlassPanel className="p-4 bg-[#0a0a0f]/40 backdrop-blur-xl border border-cyan-500/20 shadow-xl" elevated>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          <h3 className="text-on-surface font-headline-sm text-[12px] font-bold">Son İşlemler</h3>
        </div>
        <button
          onClick={loadTransactions}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-white/5 active:scale-95 transition-all text-on-surface-variant hover:text-on-surface disabled:opacity-50 cursor-pointer"
          title="Yenile"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-on-surface-variant gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <p className="text-[10px]">Yükleniyor...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-on-surface-variant text-center gap-2">
          <p className="text-[10px] font-medium">Henüz işlem gerçekleştirilmedi</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Yatay akışlı pürüzsüz kaydırılabilir carousel alanı */}
          <div className="flex flex-row gap-3 overflow-x-auto scrollbar-none pb-2 -mx-2 px-2 scroll-smooth">
            {transactions.map((tx) => {
              const isVoided = tx.status === "VOIDED";
              const isVoidRecord = tx.type === "VOID";
              const isEarn = tx.type === "EARN";

              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`w-72 flex-shrink-0 p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 relative ${
                    isVoided
                      ? "bg-rose-950/5 border-rose-500/10 opacity-60 line-through decoration-rose-500/40 shadow-sm"
                      : isVoidRecord
                      ? "bg-red-950/10 border-red-500/20 shadow-md shadow-red-950/5"
                      : "bg-white/5 border-white/5 hover:border-cyan-500/10 hover:bg-white/10 shadow-lg shadow-black/10"
                  }`}
                >
                  {/* Kart Üst Bölüm: İkon, Başlık ve Puan */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isVoidRecord ? (
                        <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        </div>
                      ) : isEarn ? (
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <Star className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                          <Gift className="w-3.5 h-3.5 text-rose-400" />
                        </div>
                      )}
                      <div>
                        {isVoided && (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider">
                            İptal
                          </span>
                        )}
                        {isVoidRecord && (
                          <span className="px-1.5 py-0.5 rounded bg-red-600/30 text-red-300 border border-red-500/40 text-[10px] font-black uppercase tracking-wider">
                            Void
                          </span>
                        )}
                        {!isVoided && !isVoidRecord && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            isEarn ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}>
                            {isEarn ? "Earn" : "Burn"}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono ${
                        isVoidRecord
                          ? "bg-red-500/10 text-red-400"
                          : isEarn
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {tx.pointsAmount > 0 ? `+${tx.pointsAmount}` : tx.pointsAmount} Pts
                    </span>
                  </div>

                  {/* Kart Orta Bölüm: Müşteri */}
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-200 truncate">{tx.customerName}</p>
                    <p className="text-[10px] font-mono text-slate-500">{tx.customerPhone}</p>
                  </div>

                  {/* Kart Alt Bilgi Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[10px] text-slate-400">
                    <div>
                      <p className="text-slate-500 uppercase font-bold tracking-wider text-[10px]">Tutar</p>
                      <p className="font-semibold text-slate-300">{formatCurrency(tx.amountSpent)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500 uppercase font-bold tracking-wider text-[10px]">Kasiyer</p>
                      <p className="font-semibold text-slate-300 truncate">{tx.cashierName.split(" ")[0]}</p>
                    </div>
                  </div>

                  {/* Kart En Alt Eylem ve Saat */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                      <Clock className="w-3 h-3 text-cyan-400/30" />
                      <span>{tx.createdAtFormatted.split(",")[1] || tx.createdAtFormatted}</span>
                    </div>

                    {!isVoided && !isVoidRecord && (
                      <button
                        onClick={() => handleVoid(tx.id)}
                        disabled={voidingId !== null}
                        className="h-8 px-3 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30"
                      >
                        {voidingId === tx.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          "İptal (Void)"
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Touch-screen friendly client-side pagination buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/20 text-[10px] font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Önceki</span>
            </button>
            <span className="text-[10px] font-bold text-slate-400 font-mono">
              Sayfa {page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={transactions.length < 5 || loading}
              className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/20 text-[10px] font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Sonraki</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
