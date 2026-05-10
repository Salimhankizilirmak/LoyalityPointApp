"use client";

import { motion } from "framer-motion";
import { Store, Star, Award, Users } from "lucide-react";

interface BossOverviewStatsProps {
  activeBranches: number;
  totalEarned: number;
  totalSpent: number;
  employeeCount: number;
  isDarkMode: boolean;
}

export function BossOverviewStats({
  activeBranches,
  totalEarned,
  totalSpent,
  employeeCount,
  isDarkMode
}: BossOverviewStatsProps) {
  const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

  const stats = [
    { icon: Store, label: "Aktif Şube", value: String(activeBranches), color: "#2563eb", delay: 0 },
    { icon: Award, label: "Toplam Puan", value: fmt(totalEarned), color: "#7c3aed", delay: 0.1 },
    { icon: Star, label: "Kullanılan", value: fmt(totalSpent), color: "#d97706", delay: 0.2 },
    { icon: Users, label: "Toplam Ekip", value: String(employeeCount), color: "#059669", delay: 0.3 },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ icon: Icon, label, value, color, delay }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay }}
          className={`rounded-2xl p-5 border transition-all ${
            isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100"
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
