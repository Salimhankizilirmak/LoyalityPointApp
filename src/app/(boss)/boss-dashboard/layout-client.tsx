"use client";

import { useState, ReactNode } from "react";
import { BranchSelector } from "@/components/ui/BranchSelector";
import { type BranchOption } from "@/lib/branch-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, Store, PieChart, UserPlus, LogOut, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useUser, useClerk } from "@clerk/nextjs";

interface BossLayoutClientProps {
  children: ReactNode;
  isMultiBranch?: boolean;
  activeBranchId?: string | null;
  allBranches?: BranchOption[];
}

export function BossLayoutClient({
  children,
  isMultiBranch,
  activeBranchId,
  allBranches,
}: BossLayoutClientProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();

  const navItems = [
    { name: "Şubeler", href: "/boss-dashboard/branches", icon: Store },
    { name: "Analiz", href: "/boss-dashboard/analytics", icon: PieChart },
    { name: "Yönetici Davet", href: "/boss-dashboard/invite-manager", icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-indigo-500/30">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950 border-b border-white/5 flex items-center justify-between px-4 z-[60] shadow-md">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="relative w-8 h-8 rounded overflow-hidden">
          <Image src="/okka-logo.png" alt="Logo" fill className="object-contain" />
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[65]"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-950 border-r border-white/5 flex flex-col transition-transform duration-300 z-[70] ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-end p-6 border-b border-white/5 md:hidden">
          <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        {isMultiBranch && activeBranchId && allBranches && (
          <div className="p-4 border-b border-white/5">
            <BranchSelector activeBranchId={activeBranchId} branches={allBranches} />
          </div>
        )}

        {user && (
          <div className="p-4 border-b border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden relative bg-slate-800 shrink-0">
              <Image src={user.imageUrl} alt={user.fullName || "User"} fill className="object-cover" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate">{user.fullName || "Kullanıcı"}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Patron</span>
            </div>
          </div>
        )}
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
                  active
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                }`}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="p-4 mt-auto border-t border-white/5">
            <button
              onClick={() => { setIsSidebarOpen(false); signOut(); }}
              className="w-full px-4 py-3 text-left flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-xl hover:text-red-300 transition-colors cursor-pointer"
            >
              <LogOut size={18} />
              <span className="text-sm font-bold">Çıkış Yap</span>
            </button>
          </div>
        )}
      </aside>

      {/* İçerik */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative pt-16 md:pt-0 h-screen overflow-y-auto">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
