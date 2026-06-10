"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Sun, Moon, Database } from "lucide-react";
import { UserMenu } from "@/components/ui/UserMenu";

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  branchName: string;
  showMockData: boolean;
  setShowMockData: (val: boolean) => void;
  clerkUser: {
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    imageUrl: string;
    emailAddresses: { emailAddress: string; }[];
  } | null | undefined;
  setShowSignOutOverlay: (val: boolean) => void;
}

export function Header({
  isDarkMode,
  setIsDarkMode,
  branchName,
  showMockData,
  setShowMockData,
  clerkUser,
  setShowSignOutOverlay,
}: HeaderProps) {
  const pathname = usePathname();

  const headerBg = isDarkMode
    ? "rgba(15,23,42,0.9)"
    : "rgba(255,255,255,0.9)";
  const headerBorder = isDarkMode
    ? "rgba(255,255,255,0.05)"
    : "rgba(0,0,0,0.05)";

  return (
    <header
      className="sticky top-0 z-30 w-full transition-colors duration-300"
      style={{
        background: headerBg,
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${headerBorder}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 relative">
        {/* Sol: Logo + Şube */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:rotate-12 flex-shrink-0"
            style={{
              background: "#0891b2",
              boxShadow: "0 4px 12px rgba(8,145,178,0.27)",
            }}
          >
            <MapPin size={18} className="text-white" />
          </div>
          <div
            className={`px-4 py-1.5 rounded-2xl border backdrop-blur-md transition-all ${
              isDarkMode
                ? "bg-slate-950/40 border-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.05)] text-white"
                : "bg-white/80 border-slate-200 shadow-sm text-slate-800"
            }`}
          >
            <p className="text-xs font-bold flex items-center gap-1.5 mt-0.5">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">
                Kasa Operasyon Merkezı
              </span>
              <span className="opacity-40">|</span>
              <span
                className={`text-[11px] font-mono uppercase tracking-wider font-bold ${
                  isDarkMode ? "text-cyan-400" : "text-cyan-600"
                }`}
              >
                {branchName || "Atanmamış Şube"}
              </span>
            </p>
          </div>
        </div>

        {/* Orta: Navigasyon */}
        <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
          <Link
            href="/cashier-dashboard"
            prefetch={true}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              pathname === "/cashier-dashboard"
                ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                : isDarkMode
                ? "bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
                : "bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Kasa Paneli
          </Link>
          <Link
            href="/cashier-dashboard/transactions"
            prefetch={true}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              pathname === "/cashier-dashboard/transactions"
                ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                : isDarkMode
                ? "bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
                : "bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            İşlem Geçmişi
          </Link>
        </nav>

        {/* Sağ: Kontroller */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border min-h-[40px] ${
              isDarkMode
                ? "bg-slate-800 border-slate-700 text-yellow-400"
                : "bg-slate-50 border-slate-200 text-slate-600"
            }`}
            aria-label="Koyu Tema Geçişi"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Mock Data Switch */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all ${
              isDarkMode
                ? "bg-slate-800/50 border-slate-700"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <Database
              size={12}
              className={showMockData ? "text-cyan-500" : "text-slate-400"}
            />
            <button
              onClick={() => setShowMockData(!showMockData)}
              className="relative w-8 h-4 rounded-full transition-colors duration-200"
              style={{
                background: showMockData
                  ? "#0891b2"
                  : isDarkMode
                  ? "#334155"
                  : "#e2e8f0",
              }}
              aria-label="Veri Kaynağı Değiştir"
            >
              <motion.div
                animate={{ x: showMockData ? 16 : 2 }}
                className="absolute top-1 w-2 h-2 rounded-full bg-white shadow-sm"
              />
            </button>
          </div>

          {/* User Menu */}
          <UserMenu
            user={clerkUser}
            signOut={() => setShowSignOutOverlay(true)}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </header>
  );
}
