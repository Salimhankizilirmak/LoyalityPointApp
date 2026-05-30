"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Transaction } from "../hooks/useCustomerDashboard";

interface HistorySectionProps {
  state: {
    transactions: Transaction[];
  };
}

const BRAND = "#0891b2";
const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

const TX_TYPE: Record<string, { color: string; label: string; sign: string }> = {
  earn: { color: "#059669", label: "Kazandı", sign: "+" },
  spend: { color: "#d97706", label: "Harcadı", sign: "-" },
  manual_adjustment: { color: BRAND, label: "Düzenleme", sign: "" },
};

export function HistorySection({ state }: HistorySectionProps) {
  const { transactions } = state;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-slate-800 font-semibold text-sm">İşlem Geçmişi</h2>
        <span className="text-slate-400 text-xs">{transactions.length} İşlem</span>
      </div>

      {transactions.length === 0 ? (
        <p className="text-slate-400 text-xs text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
          Henüz işlem geçmişiniz bulunmuyor.
        </p>
      ) : (
        <div className="space-y-2.5">
          {transactions.map((tx, i) => {
            const t = TX_TYPE[tx.transactionType] || TX_TYPE["earn"];
            return (
              <motion.div 
                key={tx.id} 
                initial={{ opacity: 0, x: -8 }} 
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${t.color}12` }}>
                  <Star size={16} style={{ color: t.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-slate-700 text-xs font-bold leading-tight">
                    {tx.description || (tx.amount >= 0 ? "Kazanılan Puan" : "Harcanan Puan")}
                  </p>
                  <p className="text-slate-450 text-[10px] mt-0.5 font-medium">
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("tr-TR", { 
                      day: "numeric", 
                      month: "short", 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    }) : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black" style={{ color: t.color }}>
                    {tx.amount >= 0 ? "+" : ""}{fmt(Math.floor(tx.amount / 100))}
                  </p>
                  <p className="text-slate-450 text-[9px] font-bold uppercase tracking-tight">{t.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
