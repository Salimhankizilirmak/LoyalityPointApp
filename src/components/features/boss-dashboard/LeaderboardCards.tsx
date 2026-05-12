"use client";

import { ChevronRight, Award, TrendingUp } from "lucide-react";
import { TopCustomer, Branch } from "./types";

interface LeaderboardCardsProps {
  topCustomers: TopCustomer[];
  topBranches: Branch[];
  onViewAllCustomers: () => void;
  onViewAllBranches: () => void;
}

export function LeaderboardCards({
  topCustomers,
  topBranches,
  onViewAllCustomers,
  onViewAllBranches
}: LeaderboardCardsProps) {
  const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Branches */}
      <div className="glass-panel rounded-3xl p-8 transition-all" aria-label="En Başarılı Şubeler Listesi">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <TrendingUp size={20} />
            </div>
            <h2 className="font-bold text-lg text-white">En Başarılı Şubeler</h2>
          </div>
          <button onClick={onViewAllBranches} className="text-primary text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
            Tümü <ChevronRight size={16} />
          </button>
        </div>
        <div className="space-y-6">
          {topBranches.slice(0, 3).map((b, i) => (
            <div key={b.id} className="flex items-center gap-4 group">
              <span className="text-slate-500 font-mono text-sm w-6">0{i+1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold truncate text-white group-hover:text-primary transition-colors">{b.name}</p>
                <p className="text-slate-400 text-xs font-medium">{b.transactions} İşlem</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 text-base font-black">{fmt(b.earnedPts)}</p>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Puan Kazanımı</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Customers */}
      <div className="glass-panel rounded-3xl p-8 transition-all" aria-label="Sadık Müşteriler Listesi">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Award size={20} />
            </div>
            <h2 className="font-bold text-lg text-white">Sadık Müşteriler</h2>
          </div>
          <button onClick={onViewAllCustomers} className="text-primary text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
            Tümü <ChevronRight size={16} />
          </button>
        </div>
        <div className="space-y-6">
          {topCustomers.map((c, i) => (
            <div key={i} className="flex items-center gap-4 group">
              <span className="text-slate-500 font-mono text-sm w-6">0{c.rank}</span>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xs font-black text-primary border border-white/10">
                {c.name.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold truncate text-white group-hover:text-primary transition-colors">{c.name}</p>
                <p className="text-slate-400 text-xs font-medium">{c.level} Üye</p>
              </div>
              <div className="text-right">
                <p className="text-primary text-base font-black">{fmt(c.earned)}</p>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Biriken Puan</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
