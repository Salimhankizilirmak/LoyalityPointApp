"use client";

import { motion } from "framer-motion";
import { Store, Star, Award, Users } from "lucide-react";

interface BossOverviewStatsProps {
  activeBranches: number;
  totalEarned: number;
  totalSpent: number;
  employeeCount: number;
}

export function BossOverviewStats({
  activeBranches,
  totalEarned,
  totalSpent,
  employeeCount
}: BossOverviewStatsProps) {
  const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

  const stats = [
    { icon: Store, label: "Aktif Şube", value: String(activeBranches), delay: 0 },
    { icon: Award, label: "Toplam Puan", value: fmt(totalEarned), delay: 0.1 },
    { icon: Star, label: "Kullanılan", value: fmt(totalSpent), delay: 0.2 },
    { icon: Users, label: "Toplam Ekip", value: String(employeeCount), delay: 0.3 },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ icon: Icon, label, value, delay }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay }}
          className="glass-panel-elevated rounded-3xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center`} 
              style={{ background: `var(--color-primary-container)`, color: `var(--color-on-primary-container)` }}>
              <Icon size={24} />
            </div>
          </div>
          <p className="text-3xl font-black tracking-tighter mb-1 text-white">
            {value}
          </p>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{label}</p>
        </motion.div>
      ))}
    </div>
  );
}
