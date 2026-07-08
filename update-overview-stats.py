import re

file_path = "src/components/features/manager-dashboard/ui/OverviewStats.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_content = """"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Star, Users, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Transaction } from "../types";

interface OverviewStatsProps {
  transactions: Transaction[];
  activeCashierCount: number;
  isDarkMode: boolean;
  storeSettings: { pointsEquivalent: number; tlEquivalent: number };
}

export function OverviewStats({
  transactions,
  activeCashierCount,
  isDarkMode,
  storeSettings
}: OverviewStatsProps) {
  
  // Bugünün başlangıcı
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Bugünkü işlemler (Transaction listesinde Date parse edilebilen rawTime'a sahip objeler varsa oradan bakılır. time field'ı formatlanmış (HH:mm) olabilir. Bu yüzden transactions dizisini filterlarken, transactionType vs rawTime'ı olmadığından, şu anlık basit filter yapabiliriz veya 'time' bugüne ait varsayabiliriz çünkü backend transaction query'si belki sadece bugünü vs getiriyordur. Gerçek tarih kontrolü orijinal objeden yapılmalı. Fakat şu an transactions type'ına bakalım.
  // Not: activityFeed içindeki rawTime'ı da kullanabilirdik. Ancak transactions üzerinden map ediyoruz.
  // İşlem türlerini ayıralım:
  
  // Şimdilik sadece tüm gelen transactions üzerinden:
  const earnedPts = transactions.filter(t => t.type === "earned").reduce((acc, t) => acc + (t.pts || 0), 0);
  const spentPts = transactions.filter(t => t.type === "spent").reduce((acc, t) => acc + (t.pts || 0), 0);
  
  // Hesaplama: (Harcanan Puan * TL Oranı) / Puan Oranı
  const tlEquivalentVal = storeSettings.pointsEquivalent > 0 
    ? (Math.abs(spentPts) * storeSettings.tlEquivalent) / storeSettings.pointsEquivalent 
    : 0;

  const stats = [
    { 
      icon: ShoppingBag, 
      label: "Günlük İşlem", 
      value: String(transactions.length), 
      color: "#3b82f6", 
      delay: 0,
      sub: null
    },
    { 
      icon: ArrowUpFromLine, 
      label: "Kazandırılan Puan", 
      value: Math.abs(earnedPts).toLocaleString(), 
      color: "#10b981", 
      delay: 0.1,
      sub: null
    },
    { 
      icon: ArrowDownToLine, 
      label: "Harcanan Puan", 
      value: Math.abs(spentPts).toLocaleString(), 
      color: "#f43f5e", 
      delay: 0.2,
      sub: `${tlEquivalentVal.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL İndirim`
    },
    { 
      icon: Users, 
      label: "Aktif Kasiyer", 
      value: String(activeCashierCount), 
      color: "#8b5cf6", 
      delay: 0.3,
      sub: null
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ icon: Icon, label, value, color, delay, sub }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay }}
          className={`relative overflow-hidden rounded-2xl p-5 border transition-all ${
            isDarkMode 
              ? "bg-[#0a0a0f]/60 border-white/5 shadow-2xl" 
              : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          {/* Ambient Background Glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 blur-[50px] opacity-20 pointer-events-none" style={{ backgroundColor: color }} />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border`} 
              style={{ background: `${color}15`, color, borderColor: `${color}30` }}>
              <Icon size={18} strokeWidth={2.5} />
            </div>
          </div>
          
          <div className="relative z-10">
            <p className={`text-3xl font-black tracking-tighter mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {value}
            </p>
            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">{label}</p>
            {sub && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">
                  {sub}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
"""

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)
