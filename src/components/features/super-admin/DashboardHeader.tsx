"use client";

import { motion } from "framer-motion";
import { LogOut, Shield, Database, Moon, Sun } from "lucide-react";
import { useUser } from "@clerk/nextjs";

type UserResource = ReturnType<typeof useUser>["user"];

interface DashboardHeaderProps {
  user: UserResource | null | undefined;
  showMockData: boolean;
  setShowMockData: (v: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  signOut: () => void;
}

export function DashboardHeader({ 
  user, 
  showMockData, 
  setShowMockData, 
  isDarkMode, 
  setIsDarkMode, 
  signOut 
}: DashboardHeaderProps) {
  const CYAN = "#22d3ee";

  return (
    <div className={`sticky top-0 z-30 w-full backdrop-blur-xl border-b transition-colors ${
      isDarkMode ? "bg-[#0a0f1e]/80 border-white/5" : "bg-white/80 border-slate-200"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h1 className={`font-bold text-sm leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>Global Kontrol Paneli</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Super Admin · {user?.fullName || "Admin"}</p>
          </div>
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
