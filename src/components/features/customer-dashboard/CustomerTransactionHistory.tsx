"use client";

import React from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface CustomerTransaction {
  id: string;
  transactionType: 'earn' | 'spend' | 'manual_adjustment';
  amount: number;
  createdAt: number;
}

export function CustomerTransactionHistory({ transactions }: { transactions: CustomerTransaction[] }) {
  return (
    <section aria-label="Recent Activities" className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="font-headline-md text-[20px] font-semibold text-on-surface">Recent Activity</h2>
      </div>
      
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="text-on-surface-variant text-sm text-center py-6 bg-surface-container-high/50 rounded-xl border border-white/5">
            No recent activity found.
          </div>
        ) : (
          transactions.slice(0, 5).map((tx) => (
            <div key={tx.id} className="glass-card glass-card-hover rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full border border-white/5 flex items-center justify-center ${tx.transactionType === 'earn' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {tx.transactionType === 'earn' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-body-md text-body-md font-medium text-on-surface">
                    {tx.transactionType === 'earn' ? 'Earned Points' : 'Redeemed Points'}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                    {new Date(tx.createdAt).toLocaleString("tr-TR")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`font-headline-md text-[18px] font-semibold ${tx.transactionType === 'earn' ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {tx.transactionType === 'earn' ? '+' : '-'}{(Math.abs(tx.amount) / 100).toFixed(2)} TL
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
