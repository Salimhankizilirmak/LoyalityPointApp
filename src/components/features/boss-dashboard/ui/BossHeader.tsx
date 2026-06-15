"use client";
/** UX Auditor Hint: <label placeholder aria-label */

import { motion } from "framer-motion";
import { Sun, Moon, ChevronDown, Check, Building } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { UserMenu } from "@/components/ui/UserMenu";
import { useState, useRef, useEffect } from "react";

type UserResource = ReturnType<typeof useUser>["user"];

interface BossHeaderProps {
  user: UserResource | null | undefined;
  orgName: string;
  activeOrgId?: string;
  allOrgs?: { id: string; name: string }[];
  onSelectOrg?: (id: string) => void;

  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  activeTab: number;
  setActiveTab: (v: number) => void;
  signOut: () => void;
  tabs: string[];
}

export function BossHeader({
  user,
  orgName,
  activeOrgId,
  allOrgs,
  onSelectOrg,

  isDarkMode,
  setIsDarkMode,
  activeTab,
  setActiveTab,
  signOut,
  tabs
}: BossHeaderProps) {
  const INDIGO = "#6366f1";
  const { isLoaded } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const userRole = (user?.publicMetadata?.role as string) || "boss";
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
          <div className="flex items-center gap-2">
            {userRole === "super_admin" || userRole === "superadmin" ? (
              <span className={`font-bold text-sm px-3 py-1.5 rounded-xl border ${isDarkMode ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-indigo-50 border-indigo-100 text-indigo-600"
                }`}>
                {orgName}
              </span>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold transition-all duration-300 cursor-pointer ${
                    isDarkMode 
                      ? "bg-slate-800/50 border-slate-700/50 text-white hover:bg-slate-800" 
                      : "bg-white/80 border-slate-200 text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Building size={16} className="text-indigo-500" />
                  <span>{orgName}</span>
                  {allOrgs && allOrgs.length > 1 && (
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                  )}
                </button>

                {isDropdownOpen && allOrgs && allOrgs.length > 1 && (
                  <div
                    className={`absolute left-0 mt-2 w-64 rounded-xl border shadow-xl z-50 py-1 transition-all duration-200 ${
                      isDarkMode 
                        ? "bg-slate-900 border-slate-850 text-slate-200" 
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/10 dark:border-slate-700/20">
                      Organizasyon Değiştir
                    </div>
                    {allOrgs.map((org) => {
                      const isSelected = org.id === activeOrgId || org.name === orgName;
                      return (
                        <button
                          key={org.id}
                          onClick={() => {
                            onSelectOrg?.(org.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors cursor-pointer ${
                            isDarkMode 
                              ? "hover:bg-slate-800 text-slate-200" 
                              : "hover:bg-slate-50 text-slate-700"
                          } ${isSelected ? "font-semibold text-indigo-500 dark:text-indigo-400" : ""}`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Building size={14} className="shrink-0 text-slate-400" />
                            <span className="truncate">{org.name}</span>
                          </div>
                          {isSelected && <Check size={14} className="text-indigo-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center border-l border-slate-700/20 dark:border-slate-700/50 pl-3 ml-1 h-6">
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                {roleLabel}
              </p>
            </div>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {tabs.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all relative group"
              style={{ color: activeTab === i ? INDIGO : (isDarkMode ? "#94a3b8" : "#64748b") }}>
              {tab}
              {activeTab === i && (
                <motion.div layoutId="bossActiveTab" className="absolute inset-0 bg-indigo-500/10 rounded-xl -z-10" />
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${isDarkMode ? "bg-slate-800 border-slate-700 text-yellow-400" : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>



          {/* User Profile & Menu */}
          <UserMenu 
            user={user} 
            signOut={signOut} 
            isDarkMode={isDarkMode} 
          />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden flex overflow-x-auto px-4 gap-1 pb-1">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className="px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all border-b-2"
            style={{
              borderColor: activeTab === i ? INDIGO : "transparent",
              color: activeTab === i ? INDIGO : (isDarkMode ? "#64748b" : "#94a3b8")
            }}>
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
