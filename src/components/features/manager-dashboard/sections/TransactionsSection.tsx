"use client";

import React from "react";
import { OverviewStats } from "../ui/OverviewStats";
import { TransactionFeed } from "../ui/TransactionFeed";
import { WeeklyTrendChart } from "../ui/WeeklyTrendChart";
import { Transaction, Employee, ActivityItem } from "../types";
import { Download } from "lucide-react";

interface TransactionsSectionProps {
  transactions: Transaction[];
  cashiers: Employee[];
  activityFeed: ActivityItem[];
  isDarkMode: boolean;
  onEditTransaction: (tx: Transaction) => void;
}

export function TransactionsSection({
  transactions,
  cashiers,
  activityFeed,
  isDarkMode,
  onEditTransaction,
}: TransactionsSectionProps) {
  // CSV Export handler
  const handleExportCSV = () => {
    const headers = ["Musteri", "Kasiyer", "Islem Turu", "Saat", "Kazanilan/Harcanan Puan", "Tutar (TL)"];
    const rows = transactions.map(tx => [
      `"${tx.customer.replace(/"/g, '""')}"`,
      `"${tx.cashier.replace(/"/g, '""')}"`,
      tx.type === "earned" ? "Kazanım" : tx.type === "spent" ? "Harcama" : "Yeni Üye",
      tx.time,
      tx.pts,
      tx.amount
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sube_islem_raporu_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sol Sütun (2/3) — Canlı Aktivite Akışı */}
      <div className="lg:col-span-2 space-y-6">
        <OverviewStats
          txCount={transactions.length}
          totalPts={transactions.reduce((s, t) => s + Math.abs(t.pts), 0)}
          activeEmployees={`${cashiers.filter(e => e.role === "cashier" && e.status === "active").length} Aktif Kasiyer`}
          isDarkMode={isDarkMode}
        />

        {/* Canlı İşlem Akışı Kartı */}
        <div className="relative rounded-3xl border border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl shadow-lg overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-[80px] pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#22c55e]" />
              </span>
              <h2 className="font-bold text-base text-white tracking-tight">Canlı İşlem Akışı</h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                {activityFeed.length} olay
              </span>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={transactions.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/25 hover:border-transparent text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={13} />
              <span>CSV</span>
            </button>
          </div>

          {/* Feed */}
          <div className="overflow-y-auto max-h-[560px] pr-1 py-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            <TransactionFeed
              activities={activityFeed}
              isDarkMode={isDarkMode}
              onEdit={onEditTransaction}
            />
          </div>
        </div>
      </div>

      {/* Sağ Sütun (1/3) — Trend Grafiği */}
      <div className="lg:col-span-1 space-y-6">
        <WeeklyTrendChart
          transactions={transactions}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
}
