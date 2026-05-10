"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Star, Users } from "lucide-react";

interface OverviewStatsProps {
  txCount: number;
  totalPts: number;
  activeEmployees: string;
  isDarkMode: boolean;
}

export function OverviewStats({
  txCount,
  totalPts,
  activeEmployees,
  isDarkMode
}: OverviewStatsProps) {
  const stats = [
    { icon: ShoppingBag, label: "Bugünkü İşlem", value: String(txCount), color: "#2563eb", delay: 0 },
    { icon: Star, label: "Dağıtılan Puan", value: totalPts.toLocaleString(), color: "#7c3aed", delay: 0.1 },
    { icon: Users, label: "Aktif Çalışan", value: activeEmployees, color: "#059669", delay: 0.2 },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map(({ icon: Icon, label, value, color, delay }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay }}
          className={`rounded-2xl p-5 border transition-all ${
            isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center`} 
              style={{ background: `${color}12`, color }}>
              <Icon size={20} />
            </div>
          </div>
          <p className={`text-2xl font-black tracking-tight mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            {value}
          </p>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</p>
        </motion.div>
      ))}
    </div>
  );
}
