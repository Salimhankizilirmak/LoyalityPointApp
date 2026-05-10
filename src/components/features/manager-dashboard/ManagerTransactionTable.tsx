"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { manualAdjustmentAction } from "@/app/manager-dashboard/actions";
import { Edit } from "lucide-react";

export function ManagerTransactionTable({ transactions, onRefresh }: { transactions: any[], onRefresh: () => void }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
      <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-lowest/50 backdrop-blur">
        <h3 className="font-headline-md text-headline-md text-on-surface">Branch Transactions</h3>
        <button onClick={onRefresh} className="text-primary font-label-md hover:underline">Refresh</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md">
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium text-right">Amount (TL)</th>
              <th className="p-4 font-medium text-center">Cashier ID</th>
              <th className="p-4 font-medium text-right pr-6">Action</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant/10">
            {transactions.length === 0 ? (
              <tr className="hover:bg-surface-container-lowest/80 transition-colors">
                <td colSpan={6} className="text-center py-16 text-outline">No transactions found.</td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-surface-container-lowest/80 transition-colors">
                  <td className="p-4 text-on-surface-variant text-sm">
                    {new Date(tx.createdAt).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
                      {tx.customerFirstName?.[0]}{tx.customerLastName?.[0]}
                    </div>
                    <div>
                      <span>{tx.customerFirstName} {tx.customerLastName}</span>
                      <div className="text-xs text-outline font-mono mt-0.5">#{tx.customerClerkId?.split('_')[1] || tx.customerClerkId}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    {tx.type === 'earn' && <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full text-xs font-medium border border-emerald-500/20">Earn</span>}
                    {tx.type === 'spend' && <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-1 rounded-full text-xs font-medium border border-red-500/20">Spend</span>}
                    {tx.type === 'manual_adjustment' && <span className="bg-surface-variant text-on-surface-variant px-2 py-1 rounded-full text-xs font-medium border border-outline/20">Manual</span>}
                  </td>
                  <td className={`p-4 text-right font-bold text-lg ${tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{(tx.amount / 100).toFixed(2)} TL
                  </td>
                  <td className="p-4 text-center text-outline font-mono text-xs">
                    {tx.employeeId.split('_')[1] || tx.employeeId}
                  </td>
                  <td className="p-4 text-right pr-6">
                    <ManualAdjustmentDialog 
                      customerId={tx.customerId} 
                      customerName={`${tx.customerFirstName} ${tx.customerLastName}`} 
                      onSuccess={onRefresh} 
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ManualAdjustmentDialog({ customerId, customerName, onSuccess }: { customerId: string, customerName: string, onSuccess: () => void }) {
  const [amountStr, setAmountStr] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const handleAdjust = async (isPositive: boolean) => {
    setLoading(true);
    const amountTL = parseFloat(amountStr);
    if (!isNaN(amountTL) && amountTL > 0) {
      const kurus = Math.floor(amountTL * 100);
      const finalAmount = isPositive ? kurus : -kurus;
      const res = await manualAdjustmentAction(customerId, finalAmount.toString());
      if (res.error) {
        alert(res.error);
      } else {
        setOpen(false);
        setAmountStr("");
        onSuccess();
      }
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <div className="text-xs text-outline hover:text-primary transition-colors flex items-center justify-end gap-1 ml-auto cursor-pointer">
          <Edit className="w-4 h-4" /> Adjust
        </div>
      </DialogTrigger>
      <DialogContent className="bg-surface border-outline-variant text-on-surface sm:max-w-md shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Manual Point Adjustment</DialogTitle>
          <DialogDescription className="text-on-surface-variant pt-2">
            You are manually adjusting points for <strong className="text-primary">{customerName}</strong>. This action will be logged.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <div className="space-y-3">
            <Label className="text-on-surface-variant">Amount (TL)</Label>
            <div className="flex gap-2">
              <Input 
                type="number" 
                value={amountStr} 
                onChange={(e) => setAmountStr(e.target.value)} 
                placeholder="Ex: 50" 
                className="bg-surface-container border-outline-variant focus-visible:ring-primary text-lg h-12"
              />
              <div className="bg-surface-variant border border-outline-variant flex items-center px-4 rounded-md text-on-surface-variant font-bold">₺</div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
          <Button variant="outline" className="border-red-900/50 bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700" disabled={loading || !amountStr} onClick={() => handleAdjust(false)}>
            Subtract (-)
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-on-primary" disabled={loading || !amountStr} onClick={() => handleAdjust(true)}>
            Add (+)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
