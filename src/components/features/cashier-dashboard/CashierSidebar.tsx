"use client";

import React from "react";
import Link from "next/link";
import { UserPlus, Search, Receipt, Package, HelpCircle, LogOut, QrCode } from "lucide-react";

export function CashierSidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: "qr" | "register") => void }) {
  return (
    <nav className="bg-surface-container-lowest/90 backdrop-blur-2xl text-primary font-label-md text-label-md left-0 h-full w-64 hidden md:flex border-r border-white/5 shadow-2xl flex-col p-4 gap-4 fixed z-40">
      <div className="flex items-center gap-3 mb-8 px-2 mt-4">
        <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-surface-container-high flex justify-center items-center">
          <span className="font-display font-bold text-xl text-primary">IP</span>
        </div>
        <div>
          <h1 className="font-display text-headline-md font-bold text-primary tracking-tight">Main Branch</h1>
          <p className="text-on-surface-variant font-body-md text-sm">Station 04</p>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-2">
        <button 
          onClick={() => setActiveTab("qr")}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors active:scale-[0.98] group ${activeTab === "qr" ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"}`}
        >
          <QrCode className="w-5 h-5" />
          <span>Scan / Transaction</span>
        </button>

        <button 
          onClick={() => setActiveTab("register")}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors active:scale-[0.98] group ${activeTab === "register" ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"}`}
        >
          <UserPlus className="w-5 h-5" />
          <span>Register Customer</span>
        </button>
        
        <button className="text-on-surface-variant hover:text-on-surface hover:bg-white/5 flex items-center gap-3 px-4 py-3 rounded-xl transition-colors active:scale-[0.98] group">
          <Search className="w-5 h-5" />
          <span>Lookup</span>
        </button>
        <button className="text-on-surface-variant hover:text-on-surface hover:bg-white/5 flex items-center gap-3 px-4 py-3 rounded-xl transition-colors active:scale-[0.98] group">
          <Receipt className="w-5 h-5" />
          <span>History</span>
        </button>
        <button className="text-on-surface-variant hover:text-on-surface hover:bg-white/5 flex items-center gap-3 px-4 py-3 rounded-xl transition-colors active:scale-[0.98] group">
          <Package className="w-5 h-5" />
          <span>Inventory</span>
        </button>
        <button className="text-on-surface-variant hover:text-on-surface hover:bg-white/5 flex items-center gap-3 px-4 py-3 rounded-xl transition-colors active:scale-[0.98] group">
          <HelpCircle className="w-5 h-5" />
          <span>Support</span>
        </button>
      </div>
    </nav>
  );
}
