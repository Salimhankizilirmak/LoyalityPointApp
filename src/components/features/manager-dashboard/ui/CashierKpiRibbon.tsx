"use client";

import React from "react";
import { TrendingUp, UserCheck } from "lucide-react";
import { Employee, Transaction } from "../types";

interface CashierKpiRibbonProps {
  cashiers: Employee[];
  transactions: Transaction[];
  isDarkMode: boolean;
}

export function CashierKpiRibbon({ cashiers, transactions, isDarkMode }: CashierKpiRibbonProps) {
  // Dinamik olarak kasiyer performanslarını hesapla
  const cashierStats = cashiers
    .filter((emp) => emp.role === "cashier")
    .map((cashier) => {
      const cashierTxs = transactions.filter(
        (tx) => tx.cashier.toLowerCase() === cashier.name.toLowerCase()
      );
      const totalVolume = cashierTxs.reduce((s, tx) => s + (Number(tx.amount) || 0), 0);
      const txCount = cashierTxs.length;

      return {
        ...cashier,
        totalVolume,
        txCount,
      };
    })
    .sort((a, b) => b.totalVolume - a.totalVolume);

  return (
    <div className={`rounded-3xl p-6 border transition-all duration-300 ${
      isDarkMode 
        ? "bg-slate-900/40 border-slate-800 text-white" 
        : "bg-white border-slate-200 text-slate-800 shadow-sm"
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} className="text-cyan-500" />
        <h3 className="font-bold text-sm">Kasiyer Performans Şeridi (KPI)</h3>
      </div>

      {cashierStats.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-4">Aktif kasiyer işlemi bulunmuyor.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cashierStats.map((cashier) => (
            <div
              key={cashier.id}
              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                isDarkMode 
                  ? "bg-slate-800/40 border-slate-700/50 hover:border-indigo-500/30" 
                  : "bg-slate-50 border-slate-200/60 hover:border-cyan-500/30"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  isDarkMode ? "bg-slate-700 text-cyan-400" : "bg-cyan-50 text-cyan-600"
                }`}>
                  {cashier.avatar || cashier.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{cashier.name}</p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <UserCheck size={10} />
                    <span>{cashier.txCount} İşlem</span>
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-black text-cyan-500">
                  ₺{new Intl.NumberFormat("tr-TR").format(cashier.totalVolume)}
                </p>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Hacim</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
