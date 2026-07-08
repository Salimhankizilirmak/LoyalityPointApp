"use client";

import React, { useState, useEffect, useTransition } from "react";
import { motion } from "framer-motion";
import { BarChart3, Store, ShieldAlert, Loader2, Calendar, ChevronDown } from "lucide-react";
import { getBranches } from "../actions";
import { getFilteredAnalyticsAction } from "./actions";
import { BranchAnalytics } from "@/components/features/boss-dashboard/ui/BranchAnalytics";

export default function BossAnalyticsPage() {
  const [isPending, startTransition] = useTransition();

  const [branches, setBranches] = useState<{id: string; name: string; isActive: boolean}[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedRange, setSelectedRange] = useState<"today" | "7days" | "30days" | "custom">("7days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [analytics, setAnalytics] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    async function loadMetadata() {
      try {
        const dbBranches = await getBranches();
        const mappedBranches = dbBranches.map((b: any) => ({
          id: b.id,
          name: b.name,
          isActive: b.isActive
        }));
        setBranches(mappedBranches);

        if (mappedBranches.length > 0) {
          const firstBranchId = mappedBranches[0].id;
          setSelectedBranchId(firstBranchId);
          
          const res = await getFilteredAnalyticsAction(firstBranchId, "7days");
          if (res.success && res.analytics) {
            setAnalytics(res.analytics);
          } else {
            setErrorMsg(res.error || "Analitik verileri alınamadı.");
          }
        }
      } catch (err) {
        setErrorMsg("Sistem verileri yüklenirken bir hata oluştu.");
      } finally {
        setInitialLoading(false);
      }
    }
    loadMetadata();
  }, []);

  const handleFilterChange = (branchId: string, range: typeof selectedRange) => {
    setSelectedBranchId(branchId);
    setSelectedRange(range);

    if (range === "custom") return; // DatePicker'dan tetiklenecek

    startTransition(async () => {
      try {
        const res = await getFilteredAnalyticsAction(branchId, range as any);
        if (res.success && res.analytics) {
          setAnalytics(res.analytics);
          setErrorMsg("");
        } else {
          setErrorMsg(res.error || "Veri alınamadı.");
        }
      } catch (err) {
        setErrorMsg("Sunucu hatası.");
      }
    });
  };

  const applyCustomDate = () => {
    if (!customStart || !customEnd) {
      setErrorMsg("Lütfen başlangıç ve bitiş tarihlerini seçin.");
      return;
    }
    startTransition(async () => {
      // Mock for custom date
      const res = await getFilteredAnalyticsAction(selectedBranchId, "30days");
      if (res.success && res.analytics) {
        setAnalytics(res.analytics);
        setErrorMsg("");
      }
    });
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Loader2 className="animate-spin text-cyan-400 mb-4" size={32} />
        <p className="uppercase tracking-[0.2em] text-xs font-bold">Veriler Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <BarChart3 className="text-cyan-400" size={28} /> Analiz Merkezi
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Şube bazında ciro, performans ve sadakat trendleri.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 glass-panel border border-white/10 rounded-2xl px-4 py-2.5 bg-slate-900/60 hover:bg-slate-800 transition-colors"
            >
              <Store size={14} className="text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">
                {branches.find((b) => b.id === selectedBranchId)?.name || "Şube Seçin"}
              </span>
              <ChevronDown size={14} className="text-slate-400 ml-1" />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                {branches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleFilterChange(b.id, selectedRange);
                    }}
                    className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors ${
                      selectedBranchId === b.id
                        ? "bg-cyan-500/10 text-cyan-400"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 glass-panel border border-white/10 rounded-2xl p-1 bg-slate-900/60">
            {(["today", "7days", "30days", "custom"] as const).map((r) => {
              const labels = { today: "Bugün", "7days": "1 Hafta", "30days": "1 Ay", custom: "Özel" };
              const isActive = selectedRange === r;
              return (
                <button
                  key={r}
                  onClick={() => handleFilterChange(selectedBranchId, r)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                    isActive ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {labels[r]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedRange === "custom" && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-3 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
          <Calendar className="text-slate-400" size={20} />
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-cyan-500/50" />
          <span className="text-slate-500">-</span>
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-cyan-500/50" />
          <button onClick={applyCustomDate} className="ml-auto bg-cyan-500/20 text-cyan-400 font-bold text-xs px-4 py-2 rounded-xl hover:bg-cyan-500/30 transition-colors">Uygula</button>
        </motion.div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs font-semibold flex items-center gap-3">
          <ShieldAlert size={18} /> <span>{errorMsg}</span>
        </div>
      )}

      {analytics && (
        <BranchAnalytics
          totalPointsEarned={analytics.totalPointsEarned}
          totalPointsBurned={analytics.totalPointsBurned}
          totalRevenueInKurus={analytics.totalRevenueInKurus}
          totalTransactions={analytics.totalTransactions}
          chartData={analytics.chartData}
          isLoading={isPending}
          selectedRange={selectedRange}
        />
      )}
    </div>
  );
}
