"use client";

import React from "react";
import { Terminal, Network, ShieldAlert, Activity, Key, BookOpen, Headset, Plus } from "lucide-react";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";

export function ManagerSidebar() {
  return (
    <nav className="hidden md:flex bg-surface-container-lowest fixed left-0 top-0 h-screen w-64 border-r border-outline-variant/20 shadow-sm flex-col py-6 px-4 z-40">
      <div className="mb-8 px-4 flex items-center justify-between">
        <h1 className="font-headline-sm text-[20px] text-primary font-bold">Loyalty OS</h1>
      </div>
      
      <div className="flex items-center gap-3 px-4 mb-8">
        <div className="w-10 h-10 rounded-full flex items-center justify-center">
          <UserButton signOutOptions={{ redirectUrl: "/" }} />
        </div>
        <div>
          <div className="font-label-md text-label-md text-on-surface font-bold">Admin Console</div>
          <div className="font-label-md text-[10px] text-on-surface-variant">
            <OrganizationSwitcher hidePersonal={true} appearance={{
              elements: { organizationSwitcherTrigger: "p-0 text-on-surface-variant hover:bg-transparent" }
            }} />
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-2">
        <a className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-container/20 text-primary font-bold border-l-4 border-primary font-label-md text-label-md" href="#">
          <Terminal className="w-5 h-5 fill-current" />
          Command Center
        </a>
        <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high/50 font-label-md text-label-md hover:bg-surface-container-high/80 transition-all active:translate-x-1 duration-150 rounded-lg" href="#">
          <Network className="w-5 h-5" />
          Organizations
        </a>
        <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high/50 font-label-md text-label-md hover:bg-surface-container-high/80 transition-all active:translate-x-1 duration-150 rounded-lg" href="#">
          <ShieldAlert className="w-5 h-5" />
          Security Logs
        </a>
        <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high/50 font-label-md text-label-md hover:bg-surface-container-high/80 transition-all active:translate-x-1 duration-150 rounded-lg" href="#">
          <Activity className="w-5 h-5" />
          System Health
        </a>
        <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high/50 font-label-md text-label-md hover:bg-surface-container-high/80 transition-all active:translate-x-1 duration-150 rounded-lg" href="#">
          <Key className="w-5 h-5" />
          API Keys
        </a>
      </div>
      
      <button className="mt-4 bg-primary text-on-primary w-full py-3 rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
        <Plus className="w-4 h-4" />
        Generate Report
      </button>
      
      <div className="mt-8 pt-4 border-t border-outline-variant/20 flex flex-col gap-2">
        <a className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high/50 font-label-md text-label-md rounded-lg" href="#">
          <BookOpen className="w-4 h-4" />
          Documentation
        </a>
        <a className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high/50 font-label-md text-label-md rounded-lg" href="#">
          <Headset className="w-4 h-4" />
          Support
        </a>
      </div>
    </nav>
  );
}
