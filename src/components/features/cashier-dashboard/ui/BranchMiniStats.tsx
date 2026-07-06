"use client";

import { motion } from "framer-motion";
import { Zap, Star, User } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface MiniStat {
  label: string;
  value: string;
  icon: LucideIcon;
  border: string;
  bg: string;
  color: string;
}

interface BranchMiniStatsProps {
  totalTxToday: number;
  ptsGivenToday: number;
  newMembersToday: number;
  isDarkMode: boolean;
}

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

export function BranchMiniStats({
  totalTxToday,
  ptsGivenToday,
  newMembersToday,
  isDarkMode,
}: BranchMiniStatsProps) {
  const stats: MiniStat[] = [
    {
      label: "Bugün İşlem",
      value: String(totalTxToday),
      icon: Zap,
      border: isDarkMode ? "border-indigo-500/10" : "border-indigo-500/15",
      bg: isDarkMode ? "bg-indigo-500/5" : "bg-indigo-50/50",
      color: "text-indigo-400",
    },
    {
      label: "Dağıtılan Puan",
      value: fmt(ptsGivenToday),
      icon: Star,
      border: isDarkMode ? "border-cyan-500/10" : "border-cyan-500/15",
      bg: isDarkMode ? "bg-cyan-500/5" : "bg-cyan-50/50",
      color: "text-cyan-400",
    },
    {
      label: "Yeni Üye",
      value: String(newMembersToday),
      icon: User,
      border: isDarkMode ? "border-emerald-500/10" : "border-emerald-500/15",
      bg: isDarkMode ? "bg-emerald-500/5" : "bg-emerald-50/50",
      color: "text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 h-full">
      {stats.map(({ label, value, icon: Icon, border, bg, color }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`rounded-2xl p-4 backdrop-blur-md border text-center space-y-1.5 shadow-md flex flex-col items-center justify-center ${border} ${bg}`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center mb-0.5 ${
              isDarkMode ? "bg-white/5" : "bg-slate-100"
            }`}
          >
            <Icon size={15} className={color} />
          </div>
          <p
            className={`font-bold text-[10px] font-mono leading-none ${
              isDarkMode ? "text-white" : "text-slate-800"
            }`}
          >
            {value}
          </p>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider font-mono">
            {label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
