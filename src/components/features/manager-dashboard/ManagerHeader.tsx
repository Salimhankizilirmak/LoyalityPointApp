"use client";

import React from "react";
import { Search, Menu, Shield, Bell, Settings } from "lucide-react";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";

export function ManagerHeader() {
  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden bg-surface-dim/80 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-outline-variant/30 shadow-none flex justify-between items-center h-16 px-4">
        <div className="font-headline-md text-headline-md font-bold tracking-tight text-primary">
          Loyalty OS
        </div>
        <div className="flex items-center gap-4 text-primary">
          <OrganizationSwitcher hidePersonal={true} appearance={{ elements: { organizationSwitcherTrigger: "text-primary" } }} />
          <UserButton />
        </div>
      </header>

      {/* Desktop Header Actions */}
      <div className="hidden md:flex justify-between items-center mb-8">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Branch Management</h2>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
            <input 
              className="pl-10 pr-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none w-64 transition-all" 
              placeholder="Search Customer..." 
              type="text"
            />
          </div>
          
          <div className="flex items-center gap-3 text-on-surface-variant">
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors"><Shield className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors"><Settings className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden mb-6 mt-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
        <input 
          className="w-full pl-10 pr-4 py-3 bg-surface-container border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
          placeholder="Search Customer..." 
          type="text"
        />
      </div>
    </>
  );
}
