"use client";

import { motion } from "framer-motion";
import { MapPin, Sun, Moon, Database } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { UserMenu } from "@/components/ui/UserMenu";

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
  managerName: string;
  branchName: string;
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
  tabs,
  managerName,
  branchName
}: ManagerHeaderProps) {
  const CYAN = "#0891b2";
  const { isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="sticky top-0 z-30 w-full h-16 border-b transition-colors"
        style={{
          background: isDarkMode ? "#0f172a" : "#ffffff",
          borderColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl animate-pulse ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`} />
            <div className={`w-32 h-4 rounded animate-pulse ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`} />
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full animate-pulse ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`} />
            <div className={`w-20 h-8 rounded-lg animate-pulse ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`} />
          </div>
        </div>
      </div>
    );
  }


  const userBranch = (user?.publicMetadata?.branch as string) || "Bilinmeyen Şube";
  const fallbackDisplayName = user && user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "Yönetici";
  const resolvedManagerName = managerName || fallbackDisplayName;
  const resolvedBranchName = branchName || userBranch;

  return (
    <div className="sticky top-0 z-30 w-full transition-colors duration-300" 
      style={{ 
        background: isDarkMode ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.9)", 
        backdropFilter: "blur(16px)", 
        borderBottom: `1px solid ${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` 
      }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:rotate-12 flex-shrink-0" 
            style={{ background: CYAN, boxShadow: `0 4px 12px ${CYAN}44` }}>
            <MapPin size={18} className="text-white" />
          </div>
          
          {/* Neon-Glassmorphic Karşılama Paneli */}
          <div className={`px-4 py-1.5 rounded-2xl border backdrop-blur-md transition-all ${
            isDarkMode 
              ? "bg-slate-950/40 border-indigo-500/15 shadow-[0_0_15px_rgba(99,102,241,0.05)] text-white" 
              : "bg-white/80 border-slate-200 shadow-sm text-slate-800"
          }`}>
            <p className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest font-mono leading-none">
              Hoş Geldiniz
            </p>
            <p className="text-xs font-bold flex items-center gap-1.5 mt-0.5">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">
                {resolvedManagerName}
              </span>
              <span className="opacity-40">|</span>
              <span className="opacity-70 text-[11px]">Şube: {resolvedBranchName}</span>
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto py-1 md:py-0">
          {tabs.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all relative group min-h-[44px] whitespace-nowrap"
              style={{ color: activeTab === i ? CYAN : (isDarkMode ? "#94a3b8" : "#64748b") }}>
              {tab}
              {activeTab === i && (
                <motion.div layoutId="managerActiveTab" className="absolute inset-0 bg-cyan-500/10 rounded-xl -z-10" />
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3 justify-end">
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

          {/* User Profile & Menu */}
          <UserMenu 
            user={user} 
            signOut={signOut} 
            isDarkMode={isDarkMode} 
          />
        </div>
      </div>
    </div>
  );
}
