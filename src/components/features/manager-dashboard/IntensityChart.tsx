"use client";

import { motion } from "framer-motion";

interface IntensityChartProps {
  data: number[];
  hours: string[];
  isDarkMode: boolean;
}

export function IntensityChart({ data, hours, isDarkMode }: IntensityChartProps) {
  const maxVal = Math.max(...data, 1);
  const BLUE = "#2563eb";

  return (
    <div className={`rounded-2xl p-6 border transition-all ${
      isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100 shadow-sm"
    }`}>
      <div className="mb-6">
        <h2 className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-800"}`}>Saatlik Yoğunluk</h2>
        <p className="text-slate-500 text-xs mt-1">Bugün gerçekleşen işlem/saat dağılımı</p>
      </div>
      
      <div style={{ height: 120 }} className="flex items-end justify-between gap-2 px-2">
        {data.map((v, i) => {
          const barH = (v / maxVal) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
              <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                {v}
              </div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${barH}%` }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="w-full rounded-t-lg transition-colors"
                style={{ 
                  background: v === maxVal ? BLUE : (isDarkMode ? "#1e293b" : "#eff6ff"),
                  boxShadow: v === maxVal ? `0 4px 12px ${BLUE}44` : "none"
                }}
              />
              <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                {hours[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
