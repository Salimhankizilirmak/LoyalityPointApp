"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Menu, X, ArrowLeft, LogOut, Users } from "lucide-react";
import { useState } from "react";
import { useClerk } from "@clerk/nextjs";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useClerk();

  const navItems = [
    { name: "Kasa Paneli", href: "/cashier-dashboard", icon: LayoutDashboard },
    { name: "İşlemler", href: "/cashier-dashboard/transactions", icon: Receipt },
    { name: "Müşteriler", href: "/cashier-dashboard/customers", icon: Users },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-3 left-4 z-[60] p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[65] transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen z-[70] w-64 bg-neutral-950 border-r border-white/5 flex flex-col transition-transform duration-300 shadow-2xl md:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo / Brand Area */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <img src="/okka-logo.png" alt="Okka Logo" className="w-8 h-8 object-contain" />
            <span className="font-black text-slate-100 tracking-wider text-[10px] uppercase">OkutKazan</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-4 px-2">
            Kasiyer Menüsü
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold transition-all ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                }`}
              >
                <item.icon size={16} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Area */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
          >
            <LogOut size={16} />
            Çıkış Yap
          </button>
        </div>
      </aside>
    </>
  );
}
