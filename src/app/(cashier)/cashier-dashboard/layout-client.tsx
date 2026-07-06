"use client";

import { useState, ReactNode } from "react";
import { BranchSelector, type BranchOption } from "@/components/ui/BranchSelector";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, Receipt, Users, UserPlus, LogOut, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useUser, useClerk } from "@clerk/nextjs";

interface CashierLayoutClientProps {
  children: ReactNode;
  isMultiBranch?: boolean;
  activeBranchId?: string | null;
  allBranches?: BranchOption[];
}

export function CashierLayoutClient({
  children,
  isMultiBranch,
  activeBranchId,
  allBranches,
}: CashierLayoutClientProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();

  const navItems = [
    { name: "Kasa Paneli", href: "/cashier-dashboard", icon: LayoutDashboard },
    { name: "İşlemler", href: "/cashier-dashboard/transactions", icon: Receipt },
    { name: "Müşteriler", href: "/cashier-dashboard/customers", icon: Users },
    { name: "Yeni Müşteri Ekle", href: "/cashier-dashboard/add-customer", icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Sabit Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-slate-950 border-b border-white/5 flex items-center justify-between px-4 z-[60] shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <Menu size={24} />
          </button>
          <Link href="/cashier-dashboard" className="flex items-center gap-2">
            <div className="relative w-32 h-10 rounded overflow-hidden">
              <Image src="/okka-logo.png" alt="Logo" fill className="object-contain object-left" />
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isMultiBranch && activeBranchId && allBranches && (
            <BranchSelector activeBranchId={activeBranchId} branches={allBranches} />
          )}
          {user && (
            <div className="relative border-l border-white/10 pl-4 ml-2">
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/5 transition-colors text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full border border-white/10 overflow-hidden relative bg-slate-800">
                  <Image src={user.imageUrl} alt={user.fullName || "User"} fill className="object-cover" />
                </div>
                <div className="hidden sm:flex flex-col items-start justify-center pr-2">
                  <span className="text-sm font-bold text-white leading-none">{user.fullName || "Kullanıcı"}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-1">Kasiyer</span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 hidden sm:block transition-transform duration-200 ${isProfileDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isProfileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 py-2">
                    <button
                      onClick={() => { setIsProfileDropdownOpen(false); signOut(); }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      <LogOut size={16} />
                      <span className="text-sm font-bold">Çıkış Yap</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Ana İçerik ve Sidebar */}
      <div className="flex flex-1 pt-16 relative">
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[65]"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-slate-950 border-r border-white/5 flex flex-col transition-transform duration-300 z-[70] ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="flex items-center justify-between p-4 md:hidden border-b border-white/5">
            <span className="font-bold text-sm text-slate-400 uppercase tracking-widest">Menü</span>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
                    active
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* İçerik */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
