"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, Clock, Users, ArrowUpRight, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

interface AnalyticsClientPageProps {
  initialData: {
    branchName: string;
    ciroTrend: Array<{ day: string; ciro: number }>;
    hourlyDistribution: Array<{ range: string; count: number }>;
    cashierPerformance: Array<{ id: string; name: string; txCount: number; totalVolume: number }>;
    totalTransactions: number;
  };
}

export function AnalyticsClientPage({ initialData }: AnalyticsClientPageProps) {
  const router = useRouter();

  const maxCiro = Math.max(...initialData.ciroTrend.map(d => d.ciro), 100);
  const totalCiro = initialData.ciroTrend.reduce((sum, d) => sum + d.ciro, 0);

  // SVG Line Chart Noktaları
  const width = 600;
  const height = 200;
  const padding = 30;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = initialData.ciroTrend.map((d, idx) => {
    const x = padding + (idx / 6) * chartWidth;
    const y = height - padding - (d.ciro / maxCiro) * chartHeight;
    return { x, y, day: d.day, ciro: d.ciro };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : "";

  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-white font-sans transition-colors duration-500">
      {/* Üst Bar */}
      <header className="sticky top-0 z-30 w-full backdrop-blur-xl border-b border-slate-800 bg-slate-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => router.push("/manager-dashboard")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/30 text-xs font-bold transition-all"
          >
            <ArrowLeft size={14} className="text-cyan-500" />
            Geri Dön
          </button>
          
          <div className="text-right">
            <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest font-mono">Finansal Analiz</span>
            <h1 className="text-sm font-bold truncate">Şube: {initialData.branchName}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Özet Kartlar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 relative overflow-hidden"
          >
            <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-5"><DollarSign size={80} /></div>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">Toplam Haftalık Ciro</span>
            <h2 className="text-3xl font-black mt-2 text-cyan-500">₺{new Intl.NumberFormat("tr-TR").format(totalCiro)}</h2>
            <p className="text-slate-500 text-xs mt-1">Son 7 günlük şube işlem hacmi.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 relative overflow-hidden"
          >
            <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-5"><ArrowUpRight size={80} /></div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">Toplam İşlem Adedi</span>
            <h2 className="text-3xl font-black mt-2 text-indigo-400">{initialData.totalTransactions}</h2>
            <p className="text-slate-500 text-xs mt-1">Son 100 işlem baz alınmıştır.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 relative overflow-hidden"
          >
            <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-5"><Users size={80} /></div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">Aktif Kasiyer Sayısı</span>
            <h2 className="text-3xl font-black mt-2 text-emerald-500">{initialData.cashierPerformance.length}</h2>
            <p className="text-slate-500 text-xs mt-1">İşlem onaylayan kasiyer kadrosu.</p>
          </motion.div>
        </div>

        {/* Ana Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ciro Trendi Grafiği */}
          <div className="lg:col-span-2 p-6 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-4">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-cyan-500" />
                <h3 className="font-bold text-sm">Haftalık Ciro Trendi (₺)</h3>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold uppercase tracking-wider font-mono">
                Canlı Zaman Serisi
              </span>
            </div>
            
            <div className="relative w-full overflow-hidden">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = padding + ratio * chartHeight;
                  return (
                    <line 
                      key={ratio}
                      x1={padding}
                      y1={y}
                      x2={width - padding}
                      y2={y}
                      stroke="rgba(255,255,255,0.03)"
                      strokeWidth="1"
                    />
                  );
                })}

                {areaD && <path d={areaD} fill="url(#areaGrad)" />}
                {pathD && (
                  <path 
                    d={pathD}
                    fill="none"
                    stroke="url(#lineGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Noktalar */}
                {points.map((p, idx) => (
                  <g key={idx} className="group/point">
                    <circle cx={p.x} cy={p.y} r="5" className="fill-cyan-400 stroke-slate-900 cursor-pointer" strokeWidth="2.5" />
                    <circle cx={p.x} cy={p.y} r="12" className="fill-cyan-400/20 opacity-0 group-hover/point:opacity-100 transition-opacity cursor-pointer" />
                  </g>
                ))}
              </svg>
            </div>

            {/* X Ekseni Etiketleri */}
            <div className="flex justify-between px-1 text-[10px] text-slate-400 font-medium">
              {initialData.ciroTrend.map((d, i) => (
                <div key={i} className="text-center w-14 font-mono">
                  <div>{d.day}</div>
                  <div className="text-[9px] text-cyan-400 font-bold mt-0.5">₺{d.ciro}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Yoğun Saatler Dağılımı */}
          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-6">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-indigo-500" />
              <h3 className="font-bold text-sm">Yoğun İşlem Saatleri</h3>
            </div>

            <div className="space-y-4">
              {initialData.hourlyDistribution.map((item, i) => {
                const maxCount = Math.max(...initialData.hourlyDistribution.map(h => h.count), 1);
                const percent = (item.count / maxCount) * 100;

                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400 font-mono">{item.range}</span>
                      <span>{item.count} İşlem</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-900">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Kasiyer Performans Tablosu */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-6">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-emerald-500" />
            <h3 className="font-bold text-sm">Kasiyer Ciro ve Performans Dağılımı</h3>
          </div>

          {initialData.cashierPerformance.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">Şubede işlem kaydı olan kasiyer bulunamadı.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Kasiyer Adı</th>
                    <th className="pb-3">Onayladığı İşlem</th>
                    <th className="pb-3 text-right pr-2">Toplam Şube Hacmi</th>
                  </tr>
                </thead>
                <tbody>
                  {initialData.cashierPerformance.map((c) => (
                    <tr key={c.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-all font-medium">
                      <td className="py-3 pl-2 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[11px] bg-gradient-to-tr from-indigo-900/30 to-cyan-900/30 text-indigo-300 border border-indigo-500/10">
                          {c.name[0].toUpperCase()}
                        </div>
                        <span className="font-bold">{c.name}</span>
                      </td>
                      <td className="py-3 text-slate-300 font-mono">{c.txCount} Adet</td>
                      <td className="py-3 text-right pr-2 font-bold text-cyan-400 font-mono">
                        ₺{new Intl.NumberFormat("tr-TR").format(c.totalVolume)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
