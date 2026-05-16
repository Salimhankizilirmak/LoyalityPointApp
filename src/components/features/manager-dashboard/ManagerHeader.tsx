"use client";

import { motion } from "framer-motion";
import { MapPin, LogOut, Sun, Moon, Database } from "lucide-react";
import { useUser } from "@clerk/nextjs";

type UserResource = ReturnType<typeof useUser>["user"];

interface ManagerHeaderProps {
  user: UserResource | null | undefined;
  showMockData: boolean;
  setShowMockData: (v: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  activeTab: number;
  setActiveTab: (v: number) => void;
  signOut: () => void;
  tabs: string[];
}

export function ManagerHeader({
  user,
  showMockData,
  setShowMockData,
  isDarkMode,
  setIsDarkMode,
  activeTab,
  setActiveTab,
  signOut,
  tabs
}: ManagerHeaderProps) {
  const CYAN = "#0891b2";
  const userRole = (user?.publicMetadata?.role as string) || "manager";
  const userBranch = (user?.publicMetadata?.branch as string) || "Bilinmeyen Şube";
  const roleLabel = userRole === "super_admin" ? "Süper Admin" : userRole === "boss" ? "Patron" : userRole === "manager" ? "Yönetici" : "Kasiyer";

  return (
    <div className="sticky top-0 z-30 w-full transition-colors duration-300" 
      style={{ 
        background: isDarkMode ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.9)", 
        backdropFilter: "blur(16px)", 
        borderBottom: `1px solid ${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` 
      }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:rotate-12" 
            style={{ background: CYAN, boxShadow: `0 4px 12px ${CYAN}44` }}>
            <MapPin size={18} className="text-white" />
          </div>
          <div>
            <p className={`font-bold text-sm leading-tight transition-colors ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {userBranch} <span className="text-cyan-600 ml-2 font-black">PRESTIGE</span>
            </p>
            <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-500 text-[10px] font-bold uppercase tracking-wider">
                {roleLabel}
              </span>
              · {user?.fullName || "Yükleniyor..."}
            </p>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {tabs.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all relative group min-h-[44px]"
              style={{ color: activeTab === i ? CYAN : (isDarkMode ? "#94a3b8" : "#64748b") }}>
              {tab}
              {activeTab === i && (
                <motion.div layoutId="managerActiveTab" className="absolute inset-0 bg-cyan-500/10 rounded-xl -z-10" />
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border min-h-[44px] ${
              isDarkMode ? "bg-slate-800 border-slate-700 text-yellow-400" : "bg-slate-50 border-slate-200 text-slate-600"
            }`}
            aria-label="Koyu Tema Geçişi"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all ${
            isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
          }`}>
            <Database size={12} className={showMockData ? "text-cyan-500" : "text-slate-400"} />
            <button 
              onClick={() => setShowMockData(!showMockData)}
              className="relative w-8 h-4 rounded-full transition-colors duration-200"
              style={{ background: showMockData ? CYAN : (isDarkMode ? "#334155" : "#e2e8f0") }}
              aria-label="Veri Kaynağı Değiştir"
            >
              <motion.div 
                animate={{ x: showMockData ? 16 : 2 }}
                className="absolute top-1 w-2 h-2 rounded-full bg-white shadow-sm"
              />
            </button>
          </div>

          <button onClick={signOut}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border min-h-[44px] ${
              isDarkMode ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-rose-50 border-rose-100 text-rose-600"
            }`}
            title="Çıkış Yap">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
