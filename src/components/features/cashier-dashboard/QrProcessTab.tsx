"use client";

import React, { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlassInput } from "@/components/ui/GlassInput";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { findCustomerById, processTransactionAction } from "@/app/cashier-dashboard/actions";
import { CheckCircle2, AlertCircle, Search, QrCode } from "lucide-react";
import { motion } from "framer-motion";

interface CustomerInfo {
  id: string;
  firstName: string;
  lastName: string;
  currentPoints: number;
}

export function QrProcessTab() {
  const [customerId, setCustomerId] = useState("");
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCustomer = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setMsg(null);
    setCustomerInfo(null);
    const data = await findCustomerById(id);
    if (data) {
      setCustomerInfo(data);
    } else {
      setMsg({ type: "error", text: "Müşteri bulunamadı veya henüz sisteme giriş yapmamış." });
    }
    setLoading(false);
  };

  const handleScan = (text: string) => {
    if (text && text !== customerId) {
      setCustomerId(text);
      fetchCustomer(text);
    }
  };

  const processTx = async (type: "earn" | "spend") => {
    setLoading(true);
    setMsg(null);
    const res = await processTransactionAction(customerId, amount, type);
    if (res.error) {
      setMsg({ type: "error", text: res.error });
    } else {
      setMsg({ type: "success", text: res.message! });
      setAmount("");
      fetchCustomer(customerId);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <GlassPanel className="p-6 flex flex-col h-[400px] lg:h-[500px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-headline-md text-headline-md text-on-surface">Scan Loyalty Pass</h3>
            <span className="px-3 py-1 bg-surface-container-highest rounded-full font-label-sm text-label-sm text-on-surface-variant flex items-center gap-2 border border-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Camera Active
            </span>
          </div>
          <div className="flex-1 bg-surface-dim rounded-xl border border-white/5 overflow-hidden relative flex items-center justify-center scanner-frame group">
            <Scanner onScan={(result) => handleScan(result[0].rawValue)} formats={["qr_code"]} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-64 h-64 border-2 border-primary/30 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-3xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-3xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-3xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-3xl"></div>
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Manual Lookup</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <GlassInput
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="Customer ID or Phone"
              icon={<Search className="w-5 h-5" />}
            />
            <SecondaryButton onClick={() => fetchCustomer(customerId)} disabled={loading || !customerId}>
              Search
            </SecondaryButton>
          </div>
        </GlassPanel>
      </div>

      <aside className="w-full lg:w-[400px] flex flex-col gap-6 shrink-0">
        <GlassPanel className="p-6 relative overflow-hidden group h-full">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary shadow-[0_0_15px_rgba(192,193,255,0.2)] bg-surface-container-high flex justify-center items-center">
              <QrCode className="text-primary w-6 h-6" />
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-1">Active Customer</p>
              <h3 className="font-headline-md text-headline-md text-on-surface m-0 leading-none">
                {customerInfo ? `${customerInfo.firstName} ${customerInfo.lastName}` : 'No Customer'}
              </h3>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-4 border border-white/5 mb-6">
            <div className="flex justify-between items-baseline">
              <span className="font-body-md text-on-surface-variant">Available Balance</span>
              <span className="font-display text-display text-primary tracking-tight text-3xl">
                {customerInfo ? (customerInfo.currentPoints / 100).toFixed(2) : "0.00"} <span className="text-lg text-primary/70">TL</span>
              </span>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-2">Transaction Amount (TL)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-headline-md text-on-surface-variant">₺</span>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full input-glass rounded-xl py-4 pl-10 pr-4 font-headline-md text-headline-md text-right focus:ring-0 tracking-wider" 
                  placeholder="0.00" 
                />
              </div>
            </div>
            
            {msg && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl text-sm flex items-start gap-3 ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                <div className="mt-0.5">{msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}</div>
                <div className="text-base">{msg.text}</div>
              </motion.div>
            )}

            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => processTx("earn")} 
                disabled={loading || !amount || !customerInfo}
                className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-label-md text-label-md py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Earn (10%)
              </button>
              <button 
                onClick={() => processTx("spend")} 
                disabled={loading || !amount || !customerInfo}
                className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-label-md text-label-md py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Redeem
              </button>
            </div>
          </div>
        </GlassPanel>
      </aside>
    </div>
  );
}
