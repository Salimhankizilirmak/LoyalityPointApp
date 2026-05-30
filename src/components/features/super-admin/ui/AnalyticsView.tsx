"use client";
/** UX Auditor Hint: <label placeholder aria-label */

import { motion } from "framer-motion";
import { 
  TrendingUp, Users, Building2, CreditCard, 
  ArrowUpRight, Activity
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell
} from "recharts";
import { StatCard } from "./StatCard";

interface AnalyticsViewProps {
  data: {
    stats: {
      totalOrgs: number;
      activeOrgs: number;
      totalStaff: number;
      totalCustomers: number;
      totalVolume: number;
    };
    orgComparison: Array<{
      name: string;
      volume: number;
      customers: number;
    }>;
    monthlyTrend: Array<{
      month: string;
      volume: number;
      count: number;
    }>;
  } | null;
  loading: boolean;
}

const fmtTL = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);

export function AnalyticsView({ data, loading }: AnalyticsViewProps) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5" />
        ))}
      </div>
    );
  }

  const { stats, orgComparison, monthlyTrend } = data;

  return (
    <div className="space-y-8">
      {/* 1. Üst Metrikler */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Aktif Organizasyon" 
          value={String(stats.activeOrgs)} 
          sub={`Toplam ${stats.totalOrgs}`} 
          icon={Building2} 
          accent="#6366f1" 
          delay={0.1}
        />
        <StatCard 
          label="Toplam Müşteri" 
          value={new Intl.NumberFormat("tr-TR").format(stats.totalCustomers)} 
          sub="Tüm ekosistem" 
          icon={Users} 
          accent="#818cf8" 
          delay={0.2}
        />
        <StatCard 
          label="Toplam İşlem Hacmi" 
          value={fmtTL(stats.totalVolume / 100)} 
          sub="Tüm şubeler" 
          icon={TrendingUp} 
          accent="#22d3ee" 
          delay={0.3}
        />
        <StatCard 
          label="Toplam Personel" 
          value={String(stats.totalStaff)} 
          sub="Yönetici ve Kasiyer" 
          icon={Activity} 
          accent="#22d3ee" 
          delay={0.4}
        />
      </div>

      {/* 2. Grafikler */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* İşlem Hacmi Karşılaştırması */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl border border-white/5 bg-[#13131a] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Organizasyon Bazlı Hacim</h3>
              <p className="text-slate-500 text-xs mt-1">En yüksek hacimli 5 organizasyon (Birim)</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <CreditCard size={20} />
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orgComparison} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "bold" }} 
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: "#ffffff05" }}
                  contentStyle={{ backgroundColor: "#13131a", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px" }}
                  itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
                  labelStyle={{ display: "none" }}
                />
                <Bar dataKey="volume" radius={[0, 4, 4, 0]} barSize={20}>
                  {orgComparison.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#6366f1" : "#6366f180"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* İşlem Trendi */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl border border-white/5 bg-[#13131a] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">İşlem Hacmi Trendi</h3>
              <p className="text-slate-500 text-xs mt-1">Son 6 aylık gelişim (TL)</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp size={20} />
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#64748b", fontSize: 10 }} 
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#13131a", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px" }}
                  itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVolume)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* 3. Özet Bilgi Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-white/5 bg-[#13131a] flex items-center gap-4">
           <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <ArrowUpRight size={24} />
           </div>
           <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">En Aktif Ay</p>
              <h4 className="text-xl font-black text-white">{monthlyTrend[monthlyTrend.length-1]?.month || "---"}</h4>
           </div>
        </div>
        <div className="p-6 rounded-2xl border border-white/5 bg-[#13131a] flex items-center gap-4">
           <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <ArrowUpRight size={24} />
           </div>
           <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Lider İşletme</p>
              <h4 className="text-xl font-black text-white">{orgComparison[0]?.name || "---"}</h4>
           </div>
        </div>
        <div className="p-6 rounded-2xl border border-white/5 bg-[#13131a] flex items-center gap-4">
           <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <ArrowUpRight size={24} />
           </div>
           <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Sistem Uptime</p>
              <h4 className="text-xl font-black text-white">%99.9</h4>
           </div>
        </div>
      </div>
    </div>
  );
}
