"use client";

import React from "react";
import { Receipt, Star, BadgeIcon } from "lucide-react";

export function ManagerStatsCard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/20 relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-110 transition-transform"></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
            <Receipt className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-on-surface bg-surface-container-high px-2 py-1 rounded-full">+12%</span>
        </div>
        <h3 className="font-body-md text-body-md text-on-surface-variant mb-1 relative z-10">Total Transactions Today</h3>
        <div className="font-headline-lg text-headline-lg text-on-surface relative z-10">1,284</div>
      </div>
      
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/20 relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full group-hover:scale-110 transition-transform"></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="w-10 h-10 rounded-lg bg-secondary-container/30 flex items-center justify-center text-secondary">
            <Star className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-on-surface bg-surface-container-high px-2 py-1 rounded-full">+5.4%</span>
        </div>
        <h3 className="font-body-md text-body-md text-on-surface-variant mb-1 relative z-10">Points Distributed Today</h3>
        <div className="font-headline-lg text-headline-lg text-on-surface relative z-10">45,600</div>
      </div>
      
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/20 relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full group-hover:scale-110 transition-transform"></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="w-10 h-10 rounded-lg bg-tertiary-container/20 flex items-center justify-center text-tertiary">
            <BadgeIcon className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-on-surface bg-surface-container-high px-2 py-1 rounded-full">Full Staff</span>
        </div>
        <h3 className="font-body-md text-body-md text-on-surface-variant mb-1 relative z-10">Active Cashiers</h3>
        <div className="font-headline-lg text-headline-lg text-on-surface relative z-10">8 <span className="text-body-md text-on-surface-variant font-normal">/ 10</span></div>
      </div>
    </div>
  );
}
