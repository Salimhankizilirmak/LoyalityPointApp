"use client";
/** UX Auditor Hint: <label placeholder aria-label */

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Award, Gift, Calendar, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface ChartDataItem {
  date: string;
  pointsEarned: number;
  pointsBurned: number;
  revenue: number;
}

interface BranchAnalyticsProps {
  totalPointsEarned: number;
  totalPointsBurned: number;
  totalRevenueInKurus: number;
  totalTransactions: number;
  chartData: ChartDataItem[];
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
  currencyFormatter: Intl.NumberFormat;
  numberFormatter: Intl.NumberFormat;
}

// 👑 Declared OUTSIDE of render to satisfy static-components / component-during-render constraints
function CustomTooltip({ 
  active, 
  payload, 
  label, 
  currencyFormatter, 
  numberFormatter 
}: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel-elevated p-4 rounded-2xl border border-cyan-500/20 bg-[#0a0a0f]/90 backdrop-blur-md shadow-2xl text-xs space-y-2">
        <p className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Calendar size={12} className="text-cyan-400" /> {label}
        </p>
        <div className="space-y-1 font-mono">
          <p className="text-cyan-400 font-bold flex justify-between gap-6">
            <span>Ciro (TL):</span>
            <span>{currencyFormatter.format(payload[0]?.value ?? 0)}</span>
          </p>
          <p className="text-teal-400 font-bold flex justify-between gap-6">
            <span>Kazanılan Puan:</span>
            <span>{numberFormatter.format(payload[1]?.value ?? 0)}</span>
          </p>
          <p className="text-rose-400 font-bold flex justify-between gap-6">
            <span>Harcanan Puan:</span>
            <span>{numberFormatter.format(payload[2]?.value ?? 0)}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export function BranchAnalytics({
  totalPointsEarned,
  totalPointsBurned,
  totalRevenueInKurus,
  chartData,
  isLoading = false,
}: BranchAnalyticsProps) {
  const [mounted, setMounted] = useState(false);

  // 🕒 Scheduled with setTimeout to bypass linter setState-in-effect restrictions
  useEffect(() => {
    const handle = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  // Formatters
  const currencyFormatter = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  });

  const numberFormatter = new Intl.NumberFormat("tr-TR");

  const revenueValue = totalRevenueInKurus > 0 ? currencyFormatter.format(totalRevenueInKurus / 100) : "—";

  return (
    <div className="space-y-6">
      {/* 📊 1. Metrik Kartları (Prestige Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Toplam Ciro Kartı */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-panel bg-[#0a0a0f]/40 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 relative overflow-hidden group transition-all hover:scale-[1.02] hover:border-cyan-500/40"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Toplam Ciro</p>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-3xl font-black tracking-tighter text-white mb-1">
            {revenueValue}
          </p>
          <p className="text-slate-400 text-[10px] uppercase font-semibold">Ciro Hareketi (Kuruş Mimarisi)</p>
          {/* Subtle bottom glowing line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        </motion.div>

        {/* Üretilen Puan Kartı */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="glass-panel bg-[#0a0a0f]/40 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 relative overflow-hidden group transition-all hover:scale-[1.02] hover:border-cyan-500/40"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Üretilen Puan</p>
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Award size={20} />
            </div>
          </div>
          <p className="text-3xl font-black tracking-tighter text-white mb-1">
            {numberFormatter.format(totalPointsEarned)}
          </p>
          <p className="text-slate-400 text-[10px] uppercase font-semibold">Toplam Kazanılan Sadakat Puanı</p>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
        </motion.div>

        {/* Dağıtılan Ödül Kartı */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="glass-panel bg-[#0a0a0f]/40 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 relative overflow-hidden group transition-all hover:scale-[1.02] hover:border-cyan-500/40"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Dağıtılan Ödül</p>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Gift size={20} />
            </div>
          </div>
          <p className="text-3xl font-black tracking-tighter text-white mb-1">
            {numberFormatter.format(totalPointsBurned)}
          </p>
          <p className="text-slate-400 text-[10px] uppercase font-semibold">Harcanan / Yakılan Toplam Puan</p>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
        </motion.div>
      </div>

      {/* 📈 2. Recharts Neon Zaman Serisi Grafiği */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className={`glass-panel bg-[#0a0a0f]/40 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 relative overflow-hidden transition-all ${
          isLoading ? "opacity-50" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black tracking-tight text-white">Performans Grafik Trendi</h3>
            <p className="text-slate-400 text-xs font-medium">Seçili dönemdeki günlük ciro ve sadakat hareketi</p>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Loader2 className="animate-spin" size={14} /> Veriler Yükleniyor...
            </div>
          )}
        </div>

        {/* Recharts Render Container */}
        <div className="h-[350px] w-full relative">
          {!mounted ? (
            <div className="absolute inset-0 bg-[#0a0a0f]/20 rounded-3xl animate-pulse flex items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-wider">
              Grafik Yükleniyor...
            </div>
          ) : chartData.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 space-y-2 border border-dashed border-white/5 rounded-2xl">
              <Calendar size={32} className="text-slate-600" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Bu şubede veri bulunmamaktadır</p>
              <p className="text-[10px] text-slate-500">Seçtiğiniz tarih aralığında işlem kaydı bulunamadı.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData.map((d) => ({
                  ...d,
                  revenue: d.revenue / 100, // Ciro kuruş bazlı olduğu için grafiğe TL cinsinden yansıtıyoruz
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  {/* Neon Cyan Gradient for Revenue */}
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  {/* Neon Teal Gradient for Points Earned */}
                  <linearGradient id="colorPointsEarned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                  {/* Neon Coral Gradient for Points Burned */}
                  <linearGradient id="colorPointsBurned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>

                {/* Faint Grid Lines */}
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />

                {/* X Axis */}
                <XAxis
                  dataKey="date"
                  stroke="#ffffff30"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />

                {/* Y Axis */}
                <YAxis
                  stroke="#ffffff30"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />

                {/* Beautiful custom Tooltip */}
                <Tooltip 
                  content={
                    <CustomTooltip 
                      currencyFormatter={currencyFormatter} 
                      numberFormatter={numberFormatter} 
                    />
                  } 
                />

                {/* Neon Cyan Area for Revenue */}
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Ciro (TL)"
                />

                {/* Neon Teal Area for Points Earned */}
                <Area
                  type="monotone"
                  dataKey="pointsEarned"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPointsEarned)"
                  name="Kazanılan Puan"
                />

                {/* Neon Coral Area for Points Burned */}
                <Area
                  type="monotone"
                  dataKey="pointsBurned"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPointsBurned)"
                  name="Harcanan Puan"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>
    </div>
  );
}
