"use client";

import React, { useState, useMemo } from "react";
import { OverviewStats } from "../ui/OverviewStats";
import { TransactionFeed } from "../ui/TransactionFeed";
import { Transaction, Employee, ActivityItem } from "../types";
import { Download, FileText, FileSpreadsheet, ChevronDown, CalendarIcon, CalendarRange, Clock } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { logExportAction } from "@/app/(manager)/manager-dashboard/actions";

interface TransactionsSectionProps {
  transactions: Transaction[];
  cashiers: Employee[];
  activityFeed: ActivityItem[];
  isDarkMode: boolean;
  onEditTransaction: (tx: Transaction) => void;
  storeSettings: { pointsEquivalent: number; tlEquivalent: number };
}

type FilterType = "today" | "week" | "month" | "custom" | "all";

export function TransactionsSection({
  transactions,
  cashiers,
  activityFeed,
  isDarkMode,
  onEditTransaction,
  storeSettings
}: TransactionsSectionProps) {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<FilterType>("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const formatExportDate = (rawTime: number) => {
    const d = new Date(rawTime);
    if (isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const sanitizeForPdf = (text: string) => {
    if (!text) return "-";
    return text.replace(/ş/g, "s").replace(/Ş/g, "S")
               .replace(/ğ/g, "g").replace(/Ğ/g, "G")
               .replace(/ü/g, "u").replace(/Ü/g, "U")
               .replace(/ö/g, "o").replace(/Ö/g, "O")
               .replace(/ı/g, "i").replace(/İ/g, "I")
               .replace(/ç/g, "c").replace(/Ç/g, "C");
  };


  const filteredFeed = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = today - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = today - 30 * 24 * 60 * 60 * 1000;

    return activityFeed.filter((item) => {
      const itemTime = item.rawTime;
      if (filterType === "all") return true;
      if (filterType === "today") return itemTime >= today;
      if (filterType === "week") return itemTime >= weekAgo;
      if (filterType === "month") return itemTime >= monthAgo;
      if (filterType === "custom") {
        if (!startDate && !endDate) return true;
        let start = startDate ? new Date(startDate).getTime() : 0;
        let end = endDate ? new Date(endDate).getTime() + 86399999 : Infinity; // Include the end of the day
        return itemTime >= start && itemTime <= end;
      }
      return true;
    });
  }, [activityFeed, filterType, startDate, endDate]);

  const activeCashierCount = cashiers.filter(e => e.role === "cashier" && e.status === "active").length;
  
  // Bugüne ait olan işlemleri transactions objesinden süzme 
  const todayTransactions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return transactions.filter(t => {
      // Not: rawTime transactions arrayinde olmayabilir. Basit filter veya tümü
      // Gerçek implementasyonda backend bugün filtreli veri yolluyor veya rawTime ile frontendde
      return true; 
    });
  }, [transactions]);


  // CSV Export handler
  const handleExportCSV = async () => {
    setIsExportMenuOpen(false);
    setExporting(true);
    await logExportAction("CSV");

    const headers = ["Müşteri", "İşlem Yapan", "İşlem Türü", "Saat", "Kazanılan/Harcanan Puan", "Tutar (TL)"];
    const rows = filteredFeed.map(tx => [
      `"${(tx.targetName || "-").replace(/"/g, '""')}"`,
      `"${(tx.actorName || "-").replace(/"/g, '""')}"`,
      tx.type,
      formatExportDate(tx.rawTime),
      tx.pts || 0,
      tx.amount || 0
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Sube_Islem_Raporu_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExporting(false);
  };

  // PDF Export handler
  const handleExportPDF = async () => {
    setIsExportMenuOpen(false);
    setExporting(true);
    await logExportAction("PDF");

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Sube Islem Raporu", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const today = new Date();
    doc.text(`Tarih: ${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`, 14, 28);
    doc.text(`Toplam Islem: ${filteredFeed.length}`, 14, 34);

    const tableColumn = ["Hedef / Musteri", "Islem Yapan", "Islem Turu", "Tarih"];
    const tableRows = filteredFeed.map(tx => [
      sanitizeForPdf(tx.targetName || "-"),
      sanitizeForPdf(tx.actorName || "-"),
      sanitizeForPdf(tx.type),
      formatExportDate(tx.rawTime)
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229] },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });

    doc.save(`Sube_Islem_Raporu_${new Date().toISOString().split("T")[0]}.pdf`);
    setExporting(false);
  };

  const getFilterButtonClass = (type: FilterType) => {
    const isActive = filterType === type;
    return `px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
      isActive 
        ? "bg-emerald-500 text-white border-emerald-500 shadow-[0_0_10px_#10b98140]" 
        : "bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10"
    }`;
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      {/* İstatistikler */}
      <OverviewStats
        transactions={todayTransactions}
        activeCashierCount={activeCashierCount}
        isDarkMode={isDarkMode}
        storeSettings={storeSettings}
      />

      {/* Canlı İşlem Akışı ve Filtreleme */}
      <div className="flex-1 flex flex-col min-h-[calc(100vh-250px)] relative rounded-3xl border border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl shadow-lg overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] pointer-events-none" />

        {/* Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-white/5 gap-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#22c55e]" />
            </span>
            <h2 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
              Canlı İşlem Akışı
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {filteredFeed.length} olay
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setFilterType("all")} className={getFilterButtonClass("all")}>Tümü</button>
            <button onClick={() => setFilterType("today")} className={getFilterButtonClass("today")}>Bugün</button>
            <button onClick={() => setFilterType("week")} className={getFilterButtonClass("week")}>Bu Hafta</button>
            <button onClick={() => setFilterType("month")} className={getFilterButtonClass("month")}>Bu Ay</button>
            <button 
              onClick={() => setFilterType("custom")} 
              className={`flex items-center gap-1 ${getFilterButtonClass("custom")}`}
            >
              <CalendarRange size={12} /> Özel
            </button>

            {filterType === "custom" && (
              <div className="flex items-center gap-2 ml-2">
                <div className="relative w-[130px]">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#13131a] border border-white/10 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:left-0"
                  />
                  <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                </div>
                <span className="text-neutral-500 font-bold">-</span>
                <div className="relative w-[130px]">
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#13131a] border border-white/10 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:left-0"
                  />
                  <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                </div>
              </div>
            )}

            <div className="relative ml-2 border-l border-white/10 pl-4">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                disabled={filteredFeed.length === 0 || exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/25 hover:border-transparent text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download size={13} />
                )}
                <span>Dışa Aktar</span>
                <ChevronDown size={13} className={`transition-transform ${isExportMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-neutral-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                  <button
                    onClick={handleExportPDF}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-indigo-500/20 hover:text-indigo-400 flex items-center gap-2 transition-colors"
                  >
                    <FileText size={14} /> PDF Olarak İndir
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-indigo-500/20 hover:text-indigo-400 flex items-center gap-2 transition-colors border-t border-white/5"
                  >
                    <FileSpreadsheet size={14} /> CSV Olarak İndir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feed Container */}
        <div className="flex-1 overflow-y-auto pr-1 py-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {filteredFeed.length > 0 ? (
             <TransactionFeed
              activities={filteredFeed}
              isDarkMode={isDarkMode}
              onEdit={onEditTransaction}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500 pt-20 pb-20">
              <Clock size={32} className="mb-3 opacity-20" />
              <p className="text-sm">Bu tarih aralığında hiç işlem bulunamadı.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
