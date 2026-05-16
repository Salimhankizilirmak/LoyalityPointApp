"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { LogOut, Shield, Database, Moon, Sun } from "lucide-react";
import { useUser, useOrganization } from "@clerk/nextjs";

type UserResource = ReturnType<typeof useUser>["user"];

type TabType = "organizations" | "bosses";

interface DashboardHeaderProps {
  user: UserResource | null | undefined;
  showMockData: boolean;
  setShowMockData: (v: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  signOut: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function DashboardHeader({ 
  showMockData, 
  setShowMockData, 
  isDarkMode, 
  setIsDarkMode, 
  signOut,
  activeTab,
  setActiveTab
}: DashboardHeaderProps) {
  const CYAN = "#22d3ee";
  const { organization } = useOrganization();

  return (
    <div className={`sticky top-0 z-30 w-full backdrop-blur-xl border-b transition-colors ${
      isDarkMode ? "bg-[#0a0f1e]/80 border-white/5" : "bg-white/80 border-slate-200"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              {organization?.imageUrl ? (
                <Image src={organization.imageUrl} alt="Logo" width={36} height={36} className="w-full h-full object-cover" />
              ) : (
                <Shield size={18} className="text-white" />
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {organization?.name || "Novexis Tech"}
                </span>
                <span className="px-2 py-0.5 rounded-md border border-indigo-500/30 bg-indigo-500/10 text-[10px] font-black text-indigo-400 tracking-wider uppercase shadow-[0_0_12px_rgba(99,102,241,0.4)]">
                  Süper Admin
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Tabs */}
        <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-slate-500/5 border border-white/5">
          <button
            onClick={() => setActiveTab("organizations")}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "organizations"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-slate-500 hover:text-indigo-400"
            }`}
          >
            Organizasyonlar
          </button>
          <button
            onClick={() => setActiveTab("bosses")}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "bosses"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-slate-500 hover:text-indigo-400"
            }`}
          >
            Patronlar
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl border transition-all ${
              isDarkMode ? "bg-white/5 border-white/10 text-amber-400 hover:bg-white/10" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Mock Toggle */}
          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all ${
            isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-100 border-slate-200"
          }`}>
            <Database size={12} className={showMockData ? "text-cyan-400" : "text-slate-500"} />
            <button 
              onClick={() => setShowMockData(!showMockData)}
              className="relative w-8 h-4 rounded-full transition-colors duration-200"
              style={{ background: showMockData ? CYAN : "#cbd5e1" }}
            >
              <motion.div 
                animate={{ x: showMockData ? 16 : 2 }}
                className="absolute top-1 w-2 h-2 rounded-full bg-white shadow-sm"
              />
            </button>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Mock</span>
          </div>

          <button onClick={signOut} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">
            <LogOut size={14} /> Çıkış
          </button>
        </div>
      </div>
    </div>
  );
}
