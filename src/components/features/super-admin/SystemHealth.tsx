"use client";

import { motion } from "framer-motion";
import { Activity, LucideIcon } from "lucide-react";

interface Bar {
  label: string;
  value: number;
  color: string;
}

interface Infra {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}

interface SystemHealthProps {
  bars: Bar[];
  infra: Infra[];
}

export function SystemHealth({ bars, infra }: SystemHealthProps) {
  return (
    <div className="rounded-2xl p-5 border border-white/5 bg-[#0f172a]/50 backdrop-blur-sm space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Activity size={16} className="text-cyan-500" />
          <h2 className="text-white font-bold text-xs uppercase tracking-widest">Sistem Sağlık</h2>
        </div>
        <div className="space-y-4">
          {bars.map((m, i) => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-400 text-[10px] font-medium">{m.label}</span>
                <span className="text-white text-[10px] font-bold">{m.value}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${m.value}%` }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ background: m.color, boxShadow: `0 0 8px ${m.color}66` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
        {infra.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500">
              <item.icon size={10} style={{ color: item.color }} />
              <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
            </div>
            <p className="text-white text-xs font-black">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
