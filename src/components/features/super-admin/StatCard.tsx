"use client";

import { motion } from "framer-motion";
import { LucideIcon, ArrowUpRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  accent: string;
  delta?: number;
  delay?: number;
}

export function StatCard({ label, value, sub, icon: Icon, accent, delta, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-5 rounded-2xl border border-white/5 bg-[#13131a] backdrop-blur-xl group hover:border-indigo-500/30 transition-all shadow-xl"
      aria-label={`İstatistik: ${label}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ background: `${accent}15`, color: accent }}>
          <Icon size={20} />
        </div>
        {delta && (
          <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
            <ArrowUpRight size={10} /> +{delta}%
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-white tracking-tight mb-1">{value}</p>
      <div className="flex flex-col">
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{label}</p>
        <p className="text-slate-600 text-[10px] font-medium mt-0.5">{sub}</p>
      </div>
    </motion.div>
  );
}
