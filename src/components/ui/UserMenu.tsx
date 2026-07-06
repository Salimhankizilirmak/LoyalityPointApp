"use client";
//use cleint olması önemli
import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Settings } from "lucide-react";
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
  onSettingsClick?: () => void;
}

export function UserMenu({ user, signOut, isDarkMode, onSettingsClick }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user: clerkUser } = useUser();

  // Resolve role-based settings path
  const role = (clerkUser?.publicMetadata?.role as string) || "boss";
  let settingsPath = "/boss-dashboard/settings";
  if (role === "super_admin" || role === "superadmin" || role === "SUPER_ADMIN") {
    settingsPath = "/admin/settings";
  } else if (role === "boss" || role === "BOSS") {
    settingsPath = "/boss-dashboard/settings";
  } else if (role === "manager" || role === "MANAGER") {
    settingsPath = "/manager-dashboard/settings";
  } else if (role === "cashier" || role === "CASHIER") {
    settingsPath = "/cashier-dashboard/settings";
  }

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
            className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-xl z-40 py-1.5 transition-all backdrop-blur-xl ${isDarkMode
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
              {/* Profile Management removed as per requirements */}

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
    </div>
  );
}
