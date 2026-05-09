"use client";

import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { QRCodeSVG } from "qrcode.react";
import { syncCustomerData, getCustomerTransactions } from "./actions";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Clock, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function CustomerDashboard() {
  const { isLoaded, user } = useUser();
  const [customer, setCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      const init = async () => {
        try {
          const cust = await syncCustomerData();
          setCustomer(cust);
          const txs = await getCustomerTransactions();
          setTransactions(txs);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      init();
    }
  }, [isLoaded, user]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-emerald-400">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="animate-pulse">Bilgileriniz yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 sm:p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 max-w-md mx-auto">
        <h1 className="text-xl font-bold text-neutral-200">Merhaba, {user?.firstName}</h1>
        <UserButton />
      </header>

      <main className="max-w-md mx-auto space-y-6 pb-12">
        {/* Puan Kartı */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 border-none shadow-2xl shadow-emerald-500/20 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <Wallet className="w-5 h-5" />
                <span className="font-medium text-sm tracking-wide">Güncel Bakiyen</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight">
                  {customer ? (customer.currentPoints / 100).toFixed(2) : "0.00"}
                </span>
                <span className="text-xl font-medium opacity-80">TL</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* QR Kod */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl text-center py-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <h2 className="text-neutral-400 mb-6 font-medium relative z-10">Kasada Okutun</h2>
            <div className="inline-block p-4 bg-white rounded-2xl shadow-xl relative z-10 hover:scale-105 transition-transform cursor-pointer">
              <QRCodeSVG 
                value={user?.id || ""} 
                size={220}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                marginSize={1}
                imageSettings={{
                  src: "/window.svg", // Logo ekleyebiliriz ortaya, şimdilik placeholder
                  x: undefined,
                  y: undefined,
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>
            <p className="mt-6 text-xs text-neutral-500 tracking-[0.2em] font-mono relative z-10 uppercase">
              ID: {user?.id.split('_')[1] || user?.id}
            </p>
          </Card>
        </motion.div>

        {/* Geçmiş İşlemler */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-neutral-200">
            <Clock className="w-5 h-5 text-emerald-400" />
            Son İşlemler
          </h3>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-neutral-500 text-sm text-center py-6 bg-white/5 rounded-xl border border-white/10">
                Henüz bir işlem bulunmuyor.
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm transition-colors hover:bg-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tx.transactionType === 'earn' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {tx.transactionType === 'earn' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-medium text-neutral-200">{tx.transactionType === 'earn' ? 'Puan Kazanıldı' : 'Puan Harcandı'}</div>
                      <div className="text-xs text-neutral-500">
                        {new Date(tx.createdAt).toLocaleString("tr-TR")}
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold ${tx.transactionType === 'earn' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.transactionType === 'earn' ? '+' : '-'}{(Math.abs(tx.amount) / 100).toFixed(2)} TL
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
