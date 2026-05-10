"use client";

import { motion } from "framer-motion";
import { ChevronRight, Award, TrendingUp } from "lucide-react";
import { TopCustomer, Branch } from "./types";

interface LeaderboardCardsProps {
  topCustomers: TopCustomer[];
  topBranches: Branch[];
  isDarkMode: boolean;
  onViewAllCustomers: () => void;
  onViewAllBranches: () => void;
}

export function LeaderboardCards({
  topCustomers,
  topBranches,
  isDarkMode,
  onViewAllCustomers,
  onViewAllBranches
}: LeaderboardCardsProps) {
  const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Branches */}
      <div className={`rounded-3xl p-6 border transition-all ${
        isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100"
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" />
            <h2 className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-800"}`}>En Başarılı Şubeler</h2>
          </div>
          <button onClick={onViewAllBranches} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all">
            Tümü <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-4">
          {topBranches.slice(0, 3).map((b, i) => (
            <div key={b.id} className="flex items-center gap-4">
              <span className="text-slate-400 font-mono text-xs w-4">0{i+1}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${isDarkMode ? "text-white" : "text-slate-700"}`}>{b.name}</p>
                <p className="text-slate-500 text-[11px] font-medium">{b.transactions} İşlem</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-500 text-sm font-black">{fmt(b.earnedPts)}</p>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">Puan Kazanımı</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Customers */}
      <div className={`rounded-3xl p-6 border transition-all ${
        isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100"
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-purple-500" />
            <h2 className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-800"}`}>Sadık Müşteriler</h2>
          </div>
          <button onClick={onViewAllCustomers} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all">
            Tümü <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-4">
          {topCustomers.map((c, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-slate-400 font-mono text-xs w-4">0{c.rank}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${
                isDarkMode ? "bg-slate-700 text-purple-400" : "bg-purple-50 text-purple-600"
              }`}>
                {c.name.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${isDarkMode ? "text-white" : "text-slate-700"}`}>{c.name}</p>
                <p className="text-slate-500 text-[11px] font-medium">{c.level} Üye</p>
              </div>
              <div className="text-right">
                <p className="text-blue-500 text-sm font-black">{fmt(c.earned)}</p>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">Biriken Puan</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
