"use client";

import { useState, ReactNode } from "react";
import { BranchSelector, type BranchOption } from "@/components/ui/BranchSelector";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, Receipt, Users, UserPlus, LogOut, ChevronDown, QrCode } from "lucide-react";
import Image from "next/image";
import { useUser, useClerk } from "@clerk/nextjs";

interface CashierLayoutClientProps {
  children: ReactNode;
  isMultiBranch?: boolean;
  activeBranchId?: string | null;
  allBranches?: BranchOption[];
  pendingCount?: number;
}

export function CashierLayoutClient({
  children,
  isMultiBranch,
  activeBranchId,
  allBranches,
  pendingCount = 0,
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
    { name: "QR Davet", href: "/cashier-dashboard/qr-invite", icon: QrCode },
    { name: "Onay Bekleyenler", href: "/cashier-dashboard/approvals", icon: Users, badge: pendingCount },
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
          {/* Sadece mobil menü toggle ve logo kaldı, geri kalanı sidebar içine alındı */}
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
          <div className="flex items-center justify-between p-4 md:hidden border-b border-white/5 mb-2">
            <span className="font-bold text-sm text-slate-400 uppercase tracking-widest">Menü</span>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Profil ve Şube Seçimi (Sidebar Üstü) */}
          {user && (
            <div className="px-4 py-4 mb-2 border-b border-white/5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden relative bg-slate-800">
                  <Image src={user.imageUrl} alt={user.fullName || "User"} fill className="object-cover" />
                </div>
                <div className="flex flex-col justify-center overflow-hidden">
                  <span className="font-label-md text-sm text-white font-bold truncate">{user.fullName || "Kullanıcı"}</span>
                  <span className="font-label-md text-[10px] text-slate-400 uppercase tracking-widest font-black mt-0.5">Kasiyer</span>
                </div>
              </div>
              <div>
                {isMultiBranch && activeBranchId && allBranches && (
                  <BranchSelector activeBranchId={activeBranchId} branches={allBranches} />
                )}
              </div>
            </div>
          )}
          
          <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
                    active
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} />
                    {item.name}
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Çıkış Yap (Sadece Buton) */}
          {user && (
            <div className="p-4 border-t border-white/5 bg-slate-950/50">
              <button
                onClick={() => { setIsSidebarOpen(false); signOut(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors font-bold text-sm cursor-pointer"
              >
                <LogOut size={16} />
                Çıkış Yap
              </button>
            </div>
          )}
        </aside>

        {/* İçerik */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
