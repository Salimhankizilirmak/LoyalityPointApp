"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { useState, ElementType } from "react";
import Image from "next/image";
import { UserButton, OrganizationSwitcher, useClerk } from "@clerk/nextjs";

export interface SidebarNavItem {
  name: string;
  href?: string;
  onClick?: () => void;
  icon: ElementType;
  isActive?: boolean;
}

interface UniversalSidebarProps {
  title: string;
  subtitle?: string;
  navItems: SidebarNavItem[];
  showOrganizationSwitcher?: boolean;
}

export function UniversalSidebar({ title, subtitle, navItems, showOrganizationSwitcher = false }: UniversalSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useClerk();

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
        className={`fixed md:sticky top-0 left-0 h-screen z-[70] w-64 bg-slate-950 border-r border-white/5 flex flex-col transition-transform duration-300 shadow-2xl md:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Area */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative w-32 h-10 rounded overflow-hidden">
              <Image src="/okka-logo.png" alt="Logo" fill className="object-contain object-left" />
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* User / Org Area */}
        <div className="flex items-center gap-3 px-4 py-6 border-b border-white/5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center">
            <UserButton />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-200 truncate w-40">{title}</div>
            {subtitle ? (
              <div className="text-[10px] text-slate-400 mt-1 truncate w-40">{subtitle}</div>
            ) : showOrganizationSwitcher ? (
              <div className="text-[10px] mt-1">
                <OrganizationSwitcher hidePersonal={true} appearance={{
                  elements: { 
                    organizationSwitcherTrigger: "p-0 text-slate-400 hover:bg-transparent",
                    organizationSwitcherPopoverActionButton__createOrganization: "hidden",
                    organizationSwitcherPopoverActionButtonIcon__createOrganization: "hidden"
                  }
                }} />
              </div>
            ) : null}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item, index) => {
            // Genel Bakış (/) için tam eşleşme, diğerleri için startsWith eşleşmesi yapıyoruz
            const isRouteActive = item.href 
              ? (item.href === "/manager-dashboard" 
                  ? pathname === "/manager-dashboard" 
                  : pathname.startsWith(item.href)) 
              : false;
            const active = item.isActive !== undefined ? item.isActive : isRouteActive;
            
            const content = (
              <>
                <item.icon size={18} />
                {item.name}
              </>
            );

            const className = `flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-300 relative group overflow-hidden ${
              active
                ? "bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-cyan-300 shadow-lg shadow-indigo-500/10 border border-indigo-500/20"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent"
            }`;

            if (item.onClick) {
              return (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick!();
                    setIsOpen(false);
                  }}
                  className={`${className} w-full text-left`}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={item.href || index}
                href={item.href || "#"}
                onClick={() => setIsOpen(false)}
                className={className}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Area */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            Çıkış Yap
          </button>
        </div>
      </aside>
    </>
  );
}
