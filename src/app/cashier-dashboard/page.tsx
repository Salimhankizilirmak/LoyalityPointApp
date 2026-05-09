"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { motion, AnimatePresence } from "framer-motion";
import { inviteCustomerAction, findCustomerById, processTransactionAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { QrCode, UserPlus, CheckCircle2, AlertCircle } from "lucide-react";

export default function CashierDashboard() {
  const [activeTab, setActiveTab] = useState<"qr" | "register">("qr");

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
            Kasa / İşlem
          </h1>
          <OrganizationSwitcher hidePersonal={true} appearance={{
            elements: { organizationSwitcherTrigger: "text-white hover:bg-white/10 px-3 py-1.5 rounded-md" }
          }} />
        </div>
        <UserButton />
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 pt-12">
        <div className="flex bg-neutral-900 rounded-xl p-1 mb-8 w-max mx-auto border border-white/10">
          <button
            onClick={() => setActiveTab("qr")}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === "qr" ? "bg-white/10 text-white shadow-sm" : "text-neutral-400 hover:text-white"}`}
          >
            <QrCode className="w-4 h-4" /> QR & İşlem
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === "register" ? "bg-white/10 text-white shadow-sm" : "text-neutral-400 hover:text-white"}`}
          >
            <UserPlus className="w-4 h-4" /> Yeni Müşteri Kaydı
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "qr" ? (
            <motion.div key="qr" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <QrProcessTab />
            </motion.div>
          ) : (
            <motion.div key="register" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <RegisterTab />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function RegisterTab() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{type: "success" | "error", text: string} | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMsg(null);
    const result = await inviteCustomerAction(formData);
    if (result.error) setMsg({ type: "error", text: result.error });
    else {
      setMsg({ type: "success", text: result.message! });
      const form = document.getElementById('reg-form') as HTMLFormElement;
      if (form) form.reset();
    }
    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card className="bg-white/5 border-white/10 backdrop-blur-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white text-xl">Yeni Müşteri Kaydı</CardTitle>
          <CardDescription className="text-neutral-400">Müşteriyi sisteme ekleyin. Kendisine Clerk üzerinden E-posta ile davet linki gidecektir.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="reg-form" action={onSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-neutral-300">Ad</Label>
                <Input name="firstName" required className="bg-neutral-900 border-neutral-700 text-white focus-visible:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Soyad</Label>
                <Input name="lastName" required className="bg-neutral-900 border-neutral-700 text-white focus-visible:ring-emerald-500" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-300">Telefon</Label>
              <Input name="phone" type="tel" required className="bg-neutral-900 border-neutral-700 text-white focus-visible:ring-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-300">E-posta</Label>
              <Input name="email" type="email" required className="bg-neutral-900 border-neutral-700 text-white focus-visible:ring-emerald-500" />
            </div>

            {msg && (
              <div className={`p-3 rounded-md text-sm flex items-start gap-2 ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                <div className="mt-0.5">{msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}</div>
                <div>{msg.text}</div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white mt-2 h-12 text-md transition-all shadow-lg shadow-emerald-900/20">
              {loading ? "Kaydediliyor..." : "Müşteriyi Sisteme Ekle"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function QrProcessTab() {
  const [customerId, setCustomerId] = useState("");
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<{type: "success" | "error", text: string} | null>(null);

  const fetchCustomer = async (id: string) => {
    setLoading(true);
    setMsg(null);
    setCustomerInfo(null);
    const data = await findCustomerById(id);
    if (data) {
      setCustomerInfo(data);
    } else {
      setMsg({ type: "error", text: "Müşteri bulunamadı veya henüz sisteme ilk girişini yapmamış." });
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
      fetchCustomer(customerId); // Puan bilgisini yenile
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Scanner Side */}
      <div className="md:col-span-5 space-y-6">
        <Card className="bg-white/5 border-white/10 backdrop-blur-md overflow-hidden shadow-2xl">
          <CardHeader className="bg-white/5 border-b border-white/10 py-4">
            <CardTitle className="text-white text-lg">Müşteri QR Okuyucu</CardTitle>
          </CardHeader>
          <div className="bg-black/60 aspect-square flex items-center justify-center overflow-hidden">
             <Scanner onScan={(result) => handleScan(result[0].rawValue)} formats={["qr_code"]} />
          </div>
        </Card>
        
        <div className="flex gap-2">
          <Input 
            value={customerId} 
            onChange={(e) => setCustomerId(e.target.value)} 
            placeholder="Veya Müşteri ID giriniz..." 
            className="bg-white/5 border-white/10 text-white flex-1 focus-visible:ring-emerald-500"
          />
          <Button onClick={() => fetchCustomer(customerId)} disabled={loading || !customerId} className="bg-neutral-800 text-white hover:bg-neutral-700">
            Sorgula
          </Button>
        </div>
      </div>

      {/* Transaction Side */}
      <div className="md:col-span-7">
        <Card className={`bg-white/5 border-white/10 backdrop-blur-md h-full transition-opacity shadow-2xl ${!customerInfo ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          <CardHeader>
            <CardTitle className="text-white text-2xl">İşlem Menüsü</CardTitle>
            <CardDescription className="text-neutral-400">Bulunan müşteriye puan ekleyin veya düşün.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {customerInfo ? (
              <div className="p-5 bg-gradient-to-r from-emerald-500/20 to-blue-500/10 border border-emerald-500/30 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="text-sm text-emerald-400 mb-1">Müşteri</div>
                  <div className="text-xl font-bold text-white">{customerInfo.firstName} {customerInfo.lastName}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-emerald-400 mb-1">Güncel Bakiye</div>
                  <div className="text-2xl font-bold text-white">{(customerInfo.currentPoints / 100).toFixed(2)} TL</div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center text-neutral-500 h-[120px] flex items-center justify-center">
                İşlem yapmak için önce bir müşteri okutun.
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-neutral-300">İşlem / Fatura Tutarı (TL)</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    placeholder="Örn: 500" 
                    className="bg-neutral-900 border-neutral-700 text-white text-xl h-14 font-medium focus-visible:ring-emerald-500"
                  />
                  <div className="bg-neutral-800 border border-neutral-700 flex items-center px-6 rounded-md text-emerald-400 font-bold text-xl">₺</div>
                </div>
                <p className="text-sm text-neutral-500 mt-2">
                  <span className="text-emerald-400">Puan kazanırken</span> toplam alışveriş tutarını, <span className="text-red-400">puan harcarken</span> harcanacak puan (TL) miktarını giriniz.
                </p>
              </div>

              {msg && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl text-sm flex items-start gap-3 ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  <div className="mt-0.5">{msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}</div>
                  <div className="text-base">{msg.text}</div>
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-6">
                <Button 
                  onClick={() => processTx("earn")} 
                  disabled={loading || !amount || !customerInfo}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white h-16 text-lg shadow-xl shadow-emerald-900/20 border-0"
                >
                  Puan Ekle (%10)
                </Button>
                <Button 
                  onClick={() => processTx("spend")} 
                  disabled={loading || !amount || !customerInfo}
                  variant="destructive"
                  className="h-16 text-lg shadow-xl shadow-red-900/20"
                >
                  Puan Harca / Düş
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
