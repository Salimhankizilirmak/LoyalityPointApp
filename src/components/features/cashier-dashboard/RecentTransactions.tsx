"use client";

import React, { useEffect, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { getRecentBranchTransactionsAction } from "@/app/(cashier)/cashier-dashboard/actions";
import { History, RefreshCw, Star, Gift, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface RecentTransactionsProps {
  refreshTrigger?: number;
}

interface RecentTxRow {
  id: string;
  organizationId: string;
  branchId: string;
  customerId: string;
  cashierId: string;
  type: "EARN" | "BURN";
  amountSpent: number | null;
  pointsAmount: number;
  createdAtFormatted: string;
  customerName: string;
  customerPhone: string;
  cashierName: string;
}

export function RecentTransactions({ refreshTrigger }: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<Array<RecentTxRow>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTransactions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getRecentBranchTransactionsAction(10);
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
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTransactions();
    }, 0);

    return () => clearTimeout(timer);
  }, [refreshTrigger]);

  const formatCurrency = (amountInKurus: number | null) => {
    if (amountInKurus === null || amountInKurus === 0) return "—";
    const amount = amountInKurus / 100;
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);
  };

  return (
    <GlassPanel className="p-6 bg-[#0a0a0f]/40 backdrop-blur-xl border border-cyan-500/20 shadow-xl" elevated>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          <h3 className="text-on-surface font-headline-sm text-base font-bold">Son İşlemler</h3>
        </div>
        <button
          onClick={loadTransactions}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-white/5 active:scale-95 transition-all text-on-surface-variant hover:text-on-surface disabled:opacity-50"
          title="Yenile"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-4">
          {error}
        </div>
      )}

      {loading && transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <p className="text-xs">Yükleniyor...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
            <History className="w-6 h-6 text-on-surface-variant/40" />
          </div>
          <p className="text-sm font-medium">Henüz işlem gerçekleştirilmedi</p>
          <p className="text-xs text-on-surface-variant/60 max-w-[200px]">Şubeniz üzerinden yapılan son işlemler burada listelenecektir.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
          {transactions.map((tx) => {
            const isEarn = tx.type === "EARN";
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/10 hover:bg-white/10 transition-all flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isEarn ? (
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Star className="w-4 h-4 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                        <Gift className="w-4 h-4 text-rose-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{tx.customerName}</p>
                      <p className="text-[10px] text-on-surface-variant/60">{tx.customerPhone}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                      isEarn
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {isEarn ? `+${tx.pointsAmount}` : `-${tx.pointsAmount}`} Puan
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[10px] text-on-surface-variant">
                  <div className="space-y-0.5">
                    <p className="text-on-surface-variant/40 font-bold uppercase tracking-wider">Harcama</p>
                    <p className="font-semibold text-on-surface/80">{formatCurrency(tx.amountSpent)}</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-on-surface-variant/40 font-bold uppercase tracking-wider">Kasiyer</p>
                    <p className="font-semibold text-on-surface/80 truncate">{tx.cashierName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[9px] text-on-surface-variant/50 pt-1">
                  <Clock className="w-3 h-3 text-cyan-400/40" />
                  <span>{tx.createdAtFormatted}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </GlassPanel>
  );
}
