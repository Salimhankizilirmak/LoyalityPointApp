"use client";

import React from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { BadgeCheck } from "lucide-react";

export function CustomerBalanceCard({ points }: { points: number }) {
  return (
    <section aria-label="Account Balance">
      <GlassPanel className="p-6 md:p-8 relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-container/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Balance</span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-display text-primary drop-shadow-[0_0_15px_rgba(192,193,255,0.3)]">
              {(points / 100).toFixed(2)}
            </span>
            <span className="font-headline-md text-headline-md text-primary/70">TL</span>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 bg-surface-container/50 border border-white/10 rounded-full px-4 py-2">
            <BadgeCheck className="text-secondary w-5 h-5" />
            <span className="font-label-sm text-label-sm text-secondary">Aura Member</span>
          </div>
        </div>
      </GlassPanel>
    </section>
  );
}
