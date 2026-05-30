"use client";

import { useState, useRef, useEffect } from "react";
import { UserProfile } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Settings, X } from "lucide-react";
import Image from "next/image";

interface UserMenuProps {
  user: {
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    imageUrl: string;
    emailAddresses: Array<{ emailAddress: string }>;
  } | null | undefined;
  signOut: () => void | Promise<unknown>;
  isDarkMode: boolean;
}

export function UserMenu({ user, signOut, isDarkMode }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  // Safe Fallback Display Name
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.fullName || user.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "Kullanıcı";

  const email = user.emailAddresses?.[0]?.emailAddress || "";
  const avatarUrl = user.imageUrl;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-xl transition-all duration-300 hover:bg-slate-500/10 cursor-pointer focus:outline-none"
        aria-label="Kullanıcı Menüsü"
      >
        <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-slate-700/20 dark:border-white/10 shadow-sm">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              sizes="32px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-indigo-500 text-white font-black text-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <span className="hidden sm:inline text-xs font-semibold max-w-[120px] truncate leading-none">
          {displayName}
        </span>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-xl z-40 py-1.5 transition-all backdrop-blur-xl ${
              isDarkMode 
                ? "bg-slate-900/95 border-slate-800 text-slate-200 shadow-indigo-500/5" 
                : "bg-white/95 border-slate-200 text-slate-700 shadow-slate-200"
            }`}
          >
            {/* Header info */}
            <div className="px-4 py-2.5 border-b border-slate-800/10 dark:border-slate-800/50">
              <p className={`text-xs font-bold truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {displayName}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                {email}
              </p>
            </div>

            {/* Menu Items */}
            <div className="p-1.5 space-y-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowProfile(true);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                  isDarkMode 
                    ? "hover:bg-slate-800 text-slate-200" 
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <Settings size={14} className="text-slate-400" />
                <span>Profili Yönet</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut();
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer text-rose-500 hover:bg-rose-500/10`}
              >
                <LogOut size={14} />
                <span>Çıkış Yap</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clerk UserProfile Modal */}
      <AnimatePresence>
        {showProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative rounded-3xl border shadow-2xl max-w-5xl max-h-[90vh] overflow-y-auto ${
                isDarkMode 
                  ? "bg-slate-900/90 border-slate-800 shadow-indigo-500/10" 
                  : "bg-white border-slate-200 shadow-slate-250"
              }`}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowProfile(false)}
                className={`absolute top-4 right-4 z-50 p-2 rounded-xl transition-colors ${
                  isDarkMode 
                    ? "hover:bg-slate-800/80 text-slate-400 hover:text-white" 
                    : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                }`}
                aria-label="Kapat"
              >
                <X size={18} />
              </button>

              {/* UserProfile Component */}
              <div className="p-2 sm:p-4">
                <UserProfile
                  routing="hash"
                  appearance={{
                    elements: {
                      cardBox: "bg-transparent shadow-none border-none",
                      card: "bg-transparent shadow-none border-none",
                      navbar: isDarkMode ? "border-slate-800 text-slate-300" : "text-slate-600",
                      scrollBox: "bg-transparent",
                      pageScrollBox: "bg-transparent",
                      headerTitle: isDarkMode ? "text-white" : "text-slate-900",
                      headerSubtitle: isDarkMode ? "text-slate-400" : "text-slate-600",
                      profileSectionTitleText: isDarkMode ? "text-indigo-400" : "text-indigo-600",
                      formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm",
                      breadcrumbsItem: isDarkMode ? "text-slate-400" : "text-slate-500",
                      breadcrumbsItemActive: isDarkMode ? "text-white" : "text-slate-900",
                      breadcrumbsConnector: isDarkMode ? "text-slate-600" : "text-slate-300",
                      fileInputAreaButton: isDarkMode ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750" : "",
                      navbarButton: isDarkMode ? "hover:bg-slate-800/50 text-slate-400 hover:text-white" : "",
                      navbarButtonActive: isDarkMode ? "bg-slate-800 text-white" : "",
                      formFieldInput: isDarkMode ? "bg-slate-850 border-slate-700 text-white" : "",
                      formFieldLabel: isDarkMode ? "text-slate-300" : "",
                    }
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
