"use client";

import React from "react";
import { OverviewStats } from "../ui/OverviewStats";
import { TransactionFeed } from "../ui/TransactionFeed";
import { EmployeeManagement } from "../ui/EmployeeManagement";
import { CashierKpiRibbon } from "../ui/CashierKpiRibbon";
import { WeeklyTrendChart } from "../ui/WeeklyTrendChart";
import { Transaction, Employee } from "../types";
import { Download } from "lucide-react";

interface TransactionsSectionProps {
  transactions: Transaction[];
  cashiers: Employee[];
  isDarkMode: boolean;
  onEditTransaction: (tx: Transaction) => void;
}

export function TransactionsSection({
  transactions,
  cashiers,
  isDarkMode,
  onEditTransaction
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Sol Sütun - Ana İşlemler */}
      <div className="md:col-span-1 lg:col-span-2 space-y-6">
        <OverviewStats 
          txCount={transactions.length}
          totalPts={transactions.reduce((s, t) => s + Math.abs(t.pts), 0)}
          activeEmployees={`${cashiers.filter(e => e.role === "cashier" && e.status === "active").length} Aktif Kasiyer`}
          isDarkMode={isDarkMode}
        />
        
        <div className={`rounded-3xl p-6 border ${
          isDarkMode 
            ? "bg-slate-900/40 border-slate-800 text-white" 
            : "bg-white border-slate-200 text-slate-800 shadow-sm"
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
              <h2 className="font-bold text-lg">Canlı İşlem Akışı</h2>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={transactions.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/25 hover:border-transparent text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={13} />
              <span>CSV Dışa Aktar</span>
            </button>
          </div>
          
          {/* Scrollable Bound for MacBook Guard */}
          <div className="overflow-y-auto max-h-[600px] pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            <TransactionFeed 
              transactions={transactions}
              isDarkMode={isDarkMode}
              onEdit={onEditTransaction}
            />
          </div>
        </div>
      </div>

      {/* Sağ Sütun - KPI, Grafikler ve Kasiyer Yönetimi */}
      <div className="space-y-6 md:col-span-1 lg:col-span-1">
        {/* Haftalık Trend Grafiği */}
        <WeeklyTrendChart 
          transactions={transactions} 
          isDarkMode={isDarkMode} 
        />

        {/* Kasiyer Performans KPI Şeridi */}
        <CashierKpiRibbon 
          cashiers={cashiers} 
          transactions={transactions} 
          isDarkMode={isDarkMode} 
        />

        {/* Kasiyer Listesi Feed */}
        <div className={`rounded-3xl p-6 border overflow-y-auto max-h-[450px] scrollbar-thin ${
          isDarkMode 
            ? "bg-[#0f172a]/30 border-slate-800 text-white" 
            : "bg-white border-slate-200 text-slate-800 shadow-sm"
        }`}>
          <EmployeeManagement 
            employees={cashiers}
            isDarkMode={isDarkMode}
            loadingId={null}
          />
        </div>
      </div>
    </div>
  );
}
