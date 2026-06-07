"use client";

import { BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export function AnalyticsBanner() {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      onClick={() => router.push("/boss-dashboard/analytics")}
      className="glass-panel-elevated cursor-pointer rounded-3xl p-6 border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-indigo-950/10 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group transition-all hover:scale-[1.01] hover:border-cyan-500/40 relative overflow-hidden"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
          <BarChart3 size={24} />
        </div>
        <div>
          <h3 className="text-white font-bold text-base tracking-tight flex items-center gap-2">
            Gelişmiş Şube Analitik Raporlama Motoru <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">Yeni</span>
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Tüm şubelerinizin ciro trendlerini, kazanılan/harcanan puan hareketlerini neon Recharts grafikleri ile detaylıca analiz edin.
          </p>
        </div>
      </div>
      {/* <button className="px-5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider transition-all group-hover:bg-cyan-500 group-hover:text-[#0a0a0f] shrink-0">
        Detaylı Analiz Gör
      </button> */}
      <div className="absolute top-0 bottom-0 right-0 w-[4px] bg-gradient-to-b from-cyan-500 via-indigo-500 to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}
