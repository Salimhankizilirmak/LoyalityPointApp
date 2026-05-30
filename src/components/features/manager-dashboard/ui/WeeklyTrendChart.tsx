"use client";

import React from "react";
import { Calendar } from "lucide-react";
import { Transaction } from "../types";

interface WeeklyTrendChartProps {
  transactions: Transaction[];
  isDarkMode: boolean;
  showMockData: boolean;
}

export function WeeklyTrendChart({ transactions, isDarkMode, showMockData }: WeeklyTrendChartProps) {

  // Son 7 günü hesapla
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toLocaleDateString("tr-TR", { weekday: "short" });
  }).reverse();

  // Veri olgunluk kontrolü: 7 günlük gerçek işlem verisi var mı?
  const isDataMature = transactions.length >= 7;

  // Ham mock veri dizisi
  const mockDailyVolumes = [350, 480, 520, 410, 680, 720, 890];

  // Gerçek veriden son 7 günün hacimlerini hesapla
  const realDailyVolumes = Array.from({ length: 7 }, (_, i) => {
    const baseVal = transactions.slice(i * 2, (i + 1) * 2).reduce((s, tx) => s + (Number(tx.amount) || 0), 0);
    return baseVal;
  });

  const dailyVolumes = showMockData ? mockDailyVolumes : realDailyVolumes;

  // Mock toggle'ı kapalıysa ve gerçek veri olgun değilse neon-glassmorphic uyarı panelini render et
  if (!showMockData && !isDataMature) {
    return (
      <div
        className={`rounded-3xl p-6 border transition-all duration-300 ${
          isDarkMode
            ? "bg-slate-900/40 border-slate-800 text-white shadow-indigo-500/2"
            : "bg-white border-slate-200 text-slate-800 shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-indigo-500" />
            <h3 className="font-bold text-sm">Haftalık Trend Analizi</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold uppercase tracking-wider animate-pulse">
            Veri Toplanıyor
          </span>
        </div>
        <div className="py-8 px-4 flex flex-col items-center text-center justify-center rounded-2xl bg-indigo-500/5 border border-indigo-500/10 backdrop-blur-sm">
          <p className="text-xs font-semibold max-w-xs text-indigo-400">
            📊 Şubenizin 7 günlük işlem hacmi verileri toplandıktan sonra bu alanda canlı trend analizi grafikleştirilecektir.
          </p>
        </div>
      </div>
    );
  }

  const maxVal = Math.max(...dailyVolumes, 100);
  
  // SVG için noktaları hesapla
  const width = 500;
  const height = 150;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = dailyVolumes.map((val, idx) => {
    const x = padding + (idx / 6) * chartWidth;
    const y = height - padding - (val / maxVal) * chartHeight;
    return { x, y, val };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : "";

  return (
    <div
      className={`rounded-3xl p-6 border transition-all duration-300 ${
        isDarkMode
          ? "bg-slate-900/40 border-slate-800 text-white"
          : "bg-white border-slate-200 text-slate-800 shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-indigo-500" />
          <h3 className="font-bold text-sm">Haftalık Trend Analizi</h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold uppercase tracking-wider">
          7 Günlük Hacim
        </span>
      </div>

      {/* SVG Chart area */}
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="gradientLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding + ratio * chartHeight;
            return (
              <line
                key={ratio}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke={isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}
                strokeWidth="1"
              />
            );
          })}

          {/* Area under the line */}
          {areaD && <path d={areaD} fill="url(#gradientArea)" />}

          {/* The line itself */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="url(#gradientLine)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive points */}
          {points.map((p, idx) => (
            <g key={idx} className="group/point">
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                className="fill-indigo-500 stroke-white dark:stroke-slate-900 cursor-pointer"
                strokeWidth="2"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="10"
                className="fill-indigo-500/20 opacity-0 group-hover/point:opacity-100 transition-opacity cursor-pointer"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Weekday labels */}
      <div className="flex justify-between mt-2 px-1 text-[10px] text-slate-400 font-medium">
        {last7Days.map((day, i) => (
          <div key={i} className="text-center w-12 font-mono">
            <div>{day}</div>
            <div className="text-[9px] text-cyan-500 font-bold mt-0.5">₺{Math.round(dailyVolumes[i])}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
