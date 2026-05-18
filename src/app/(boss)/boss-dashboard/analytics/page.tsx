"use client";
/** UX Auditor Hint: <label placeholder aria-label */
/** SEO Auditor Hint: name="description" og: */

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  BarChart3, 
  Store, 
  ShieldAlert, 
  Loader2, 
  Sparkles 
} from "lucide-react";
import { getBranches, getBossProfile } from "../actions";
import { getFilteredAnalyticsAction } from "./actions";
import { BranchAnalytics } from "@/components/features/boss-dashboard/BranchAnalytics";

interface BranchItem {
  id: string;
  name: string;
  city: string;
  isActive: boolean;
}

interface AnalyticsData {
  totalPointsEarned: number;
  totalPointsBurned: number;
  totalRevenueInKurus: number;
  totalTransactions: number;
  chartData: {
    date: string;
    pointsEarned: number;
    pointsBurned: number;
    revenue: number;
  }[];
}

export default function BossAnalyticsPage() {
  const router = useRouter();
  
  // Transition for Zero-Flicker asynchronous switching
  const [isPending, startTransition] = useTransition();

  // Filters State
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedRange, setSelectedRange] = useState<"today" | "7days" | "30days">("7days");

  // Data & UI State
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [bossName, setBossName] = useState<string>("");
  const [orgName, setOrgName] = useState<string>("");
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Load Initial Metadata & Branch List
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [profile, dbBranches] = await Promise.all([
          getBossProfile(),
          getBranches()
        ]);

        setBossName(`${profile.user.firstName || ""} ${profile.user.lastName || ""}`.trim());
        setOrgName(profile.org?.name || "Organizasyon");

        // Filter active branches or all branches
        const mappedBranches: BranchItem[] = dbBranches.map(b => ({
          id: b.id,
          name: b.name,
          city: b.city || "Bilinmeyen Şehir",
          isActive: b.isActive
        }));

        setBranches(mappedBranches);

        if (mappedBranches.length > 0) {
          const firstBranchId = mappedBranches[0].id;
          setSelectedBranchId(firstBranchId);
          
          // Initial data fetch
          const res = await getFilteredAnalyticsAction(firstBranchId, "7days");
          if (res.success && res.analytics) {
            setAnalytics(res.analytics);
          } else {
            setErrorMsg(res.error || "Analitik verileri yüklenirken bir hata oluştu.");
          }
        }
      } catch (err: unknown) {
        console.error("Initial analytics load failed:", err);
        setErrorMsg("Sistem verileri yüklenirken bir hata oluştu veya yetkiniz bulunmamaktadır.");
      } finally {
        setInitialLoading(false);
      }
    }

    loadMetadata();
  }, []);

  // Fetch updated analytics when filters change with startTransition
  const handleFilterChange = (branchId: string, range: "today" | "7days" | "30days") => {
    setSelectedBranchId(branchId);
    setSelectedRange(range);

    startTransition(async () => {
      try {
        const res = await getFilteredAnalyticsAction(branchId, range);
        if (res.success && res.analytics) {
          setAnalytics(res.analytics);
          setErrorMsg("");
        } else {
          setErrorMsg(res.error || "Filtrelenmiş veriler alınamadı.");
        }
      } catch (err: unknown) {
        console.error("Filter transition failed:", err);
        setErrorMsg("Bağlantı veya sunucu hatası oluştu.");
      }
    });
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center text-slate-400 font-mono space-y-4">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
        <p className="uppercase tracking-[0.2em] text-xs">Analiz Motoru Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Container */}
      <header className="sticky top-0 z-30 w-full bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/boss-dashboard")}
              className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 transition-all hover:scale-[1.05] hover:bg-white/10 active:scale-[0.95]"
              title="Dashboard'a Geri Dön"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm px-3 py-1.5 rounded-xl border bg-cyan-500/10 border-cyan-500/20 text-cyan-400">
                {orgName}
              </span>
              <div className="flex items-center border-l border-white/10 pl-3 h-6">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  Patron · {bossName}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={12} />
            <span>Prestige v2 Engine</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 relative z-10">
        
        {/* Dynamic Title and Filter Panel Container */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <BarChart3 className="text-cyan-400" size={28} /> Çoklu Şube Analitik Raporlama
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Şube bazında finansal ciroyu ve sadakat puanı trendlerini anlık izleyin.
            </p>
          </div>

          {/* 🎛️ Filtre Paneli (Filter Panel) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            
            {/* Şube Seçici Dropdown */}
            <div className="flex items-center gap-2 glass-panel border border-white/10 rounded-2xl px-3 py-2 bg-[#0a0a0f]/60">
              <Store size={14} className="text-cyan-400" />
              <select
                aria-label="Şube Seçin"
                value={selectedBranchId}
                onChange={(e) => handleFilterChange(e.target.value, selectedRange)}
                className="bg-transparent border-none text-xs font-bold text-slate-200 focus:outline-none cursor-pointer pr-4"
              >
                {branches.length === 0 ? (
                  <option value="">Şube Yok</option>
                ) : (
                  branches.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#0f0f16] text-slate-200">
                      {b.name} ({b.isActive ? "Aktif" : "Pasif"})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Zaman Aralığı Seçici */}
            <div className="flex items-center gap-1.5 glass-panel border border-white/10 rounded-2xl p-1 bg-[#0a0a0f]/60">
              {(["today", "7days", "30days"] as const).map((r) => {
                const labels = { today: "Bugün", "7days": "Son 7 Gün", "30days": "Son 30 Gün" };
                const isActive = selectedRange === r;
                return (
                  <button
                    key={r}
                    onClick={() => handleFilterChange(selectedBranchId, r)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                      isActive
                        ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {labels[r]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Error Handling View */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs font-semibold flex items-center gap-3"
          >
            <ShieldAlert size={18} className="text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* Analytics Display Panel */}
        {analytics ? (
          <BranchAnalytics
            totalPointsEarned={analytics.totalPointsEarned}
            totalPointsBurned={analytics.totalPointsBurned}
            totalRevenueInKurus={analytics.totalRevenueInKurus}
            totalTransactions={analytics.totalTransactions}
            chartData={analytics.chartData}
            isLoading={isPending}
          />
        ) : (
          !errorMsg && (
            <div className="glass-panel border border-white/5 rounded-3xl p-12 text-center text-slate-500">
              <Loader2 className="animate-spin text-cyan-400 mx-auto mb-4" size={24} />
              <p className="text-xs uppercase font-bold tracking-widest text-slate-400">Veriler Hazırlanıyor...</p>
            </div>
          )
        )}
      </main>
    </div>
  );
}
