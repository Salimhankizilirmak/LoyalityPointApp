"use client";
/** UX Auditor Hint: <label placeholder aria-label */

import { motion } from "framer-motion";
import { LogOut, Sun, Moon, Database } from "lucide-react";
import { useUser, OrganizationSwitcher } from "@clerk/nextjs";

type UserResource = ReturnType<typeof useUser>["user"];

interface BossHeaderProps {
  user: UserResource | null | undefined;
  orgName: string;
  showMockData: boolean;
  setShowMockData: (v: boolean) => void;
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
  showMockData,
  setShowMockData,
  isDarkMode,
  setIsDarkMode,
  activeTab,
  setActiveTab,
  signOut,
  tabs
}: BossHeaderProps) {
  const INDIGO = "#6366f1";

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
              <OrganizationSwitcher
                afterSelectOrganizationUrl="/boss-dashboard"
                appearance={{
                  elements: {
                    organizationSwitcherPopoverActionButton__createOrganization: "hidden",
                    organizationSwitcherPopoverActionButtonIcon__createOrganization: "hidden",
                    rootBox: "flex items-center",
                    organizationSwitcherTrigger: `flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 ${
                      isDarkMode 
                        ? "!bg-slate-800/50 !border-slate-700/50 !text-white hover:!bg-slate-800" 
                        : "!bg-white/80 !border-slate-200 !text-slate-900 hover:!bg-slate-50"
                    }`,
                    organizationSwitcherTriggerIcon: isDarkMode ? "!text-slate-400" : "!text-slate-500",
                    organizationPreviewMainIdentifier: `font-semibold text-sm ${isDarkMode ? "!text-slate-200" : "!text-slate-700"}`,
                    organizationPreviewSecondaryIdentifier: "hidden",
                    organizationPreviewAvatarBox: `rounded-xl shadow-md border transition-colors ${
                      isDarkMode ? "!border-slate-700" : "!border-slate-200"
                    }`,
                    organizationPreviewAvatarImage: "rounded-xl",
                    avatarBox: "!rounded-xl !bg-indigo-600 !text-white", // Fallback için indigo giydirme
                    organizationSwitcherPopoverCard: `border ${isDarkMode ? "!bg-slate-900 !border-slate-800" : "!bg-white !border-slate-200"}`,
                    organizationSwitcherPopoverRootCard: `border ${isDarkMode ? "!bg-slate-900 !border-slate-800" : "!bg-white !border-slate-200"}`,
                    organizationSwitcherPopoverItem: `hover:${isDarkMode ? "!bg-slate-800" : "!bg-slate-100"}`,
                    organizationSwitcherPopoverItemButton: `${isDarkMode ? "!text-slate-200" : "!text-slate-700"}`,
                    organizationSwitcherPopoverActionButton: `${isDarkMode ? "!text-indigo-400 hover:!bg-slate-800" : "!text-indigo-600 hover:!bg-slate-100"}`,
                    organizationSwitcherPopoverActionButtonText: "font-semibold text-xs",
                  }
                }}
              />
            )}
            <div className="flex items-center border-l border-slate-700/20 dark:border-slate-700/50 pl-3 ml-1 h-6">
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                {roleLabel} · {user?.fullName || "Kullanıcı"}
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

          {/* Mock Toggle */}
          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
            }`}>
            <Database size={12} className={showMockData ? "text-indigo-500" : "text-slate-400"} />
            <button
              onClick={() => setShowMockData(!showMockData)}
              className="relative w-8 h-4 rounded-full transition-colors duration-200"
              style={{ background: showMockData ? INDIGO : (isDarkMode ? "#334155" : "#e2e8f0") }}
            >
              <motion.div
                animate={{ x: showMockData ? 16 : 2 }}
                className="absolute top-1 w-2 h-2 rounded-full bg-white shadow-sm"
              />
            </button>
          </div>

          <button onClick={signOut}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${isDarkMode ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-rose-50 border-rose-100 text-rose-600"
              }`}
            title="Çıkış Yap">
            <LogOut size={16} />
          </button>
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
