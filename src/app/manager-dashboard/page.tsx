"use client";

import { useEffect, useState } from "react";
import { getBranchTransactions, manualAdjustmentAction } from "./actions";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ManagerDashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTxs = async () => {
    setLoading(true);
    const data = await getBranchTransactions();
    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTxs();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
            Yönetici Paneli
          </h1>
          <OrganizationSwitcher hidePersonal={true} appearance={{
            elements: { organizationSwitcherTrigger: "text-white hover:bg-white/10 px-3 py-1.5 rounded-md" }
          }} />
        </div>
        <UserButton />
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 pt-12">
        <Card className="bg-white/5 border-white/10 backdrop-blur-md shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/10">
            <div>
              <CardTitle className="text-white text-2xl">Şube İşlemleri</CardTitle>
              <p className="text-neutral-400 mt-1">Bu şubedeki son 50 işlem hareketini inceleyin.</p>
            </div>
            <Button onClick={fetchTxs} variant="outline" className="bg-transparent border-neutral-700 text-white hover:bg-white/10 transition-colors">Tabloyu Yenile</Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-emerald-400 animate-pulse font-medium">İşlemler yükleniyor...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-neutral-400 font-semibold py-4 pl-6">Tarih</TableHead>
                    <TableHead className="text-neutral-400 font-semibold">Müşteri</TableHead>
                    <TableHead className="text-neutral-400 font-semibold">İşlem Türü</TableHead>
                    <TableHead className="text-neutral-400 font-semibold text-right">Tutar (Puan/TL)</TableHead>
                    <TableHead className="text-neutral-400 font-semibold text-center">İşlem Yapan (Kasiyer ID)</TableHead>
                    <TableHead className="text-neutral-400 font-semibold text-right pr-6">Aksiyon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableCell colSpan={6} className="text-center py-16 text-neutral-500">Henüz kaydedilmiş bir işlem bulunmuyor.</TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id} className="border-white/10 hover:bg-white/5 transition-colors">
                        <TableCell className="text-neutral-300 pl-6">
                          {new Date(tx.createdAt).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                        </TableCell>
                        <TableCell className="font-medium text-white">
                          {tx.customerFirstName} {tx.customerLastName}
                          <div className="text-xs text-neutral-500 font-mono mt-0.5" title="Müşteri ID">#{tx.customerClerkId?.split('_')[1] || tx.customerClerkId}</div>
                        </TableCell>
                        <TableCell>
                          {tx.type === 'earn' && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-normal">Puan Verildi</Badge>}
                          {tx.type === 'spend' && <Badge className="bg-red-500/10 text-red-400 border-red-500/20 font-normal">Puan Harcandı</Badge>}
                          {tx.type === 'manual_adjustment' && <Badge variant="outline" className="text-neutral-300 border-neutral-600 font-normal">Manuel Düzeltme</Badge>}
                        </TableCell>
                        <TableCell className={`text-right font-bold text-lg ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' : ''}{(tx.amount / 100).toFixed(2)} TL
                        </TableCell>
                        <TableCell className="text-center text-neutral-500 font-mono text-xs">
                          {tx.employeeId.split('_')[1] || tx.employeeId}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <ManualAdjustmentDialog 
                            customerId={tx.customerId} 
                            customerName={`${tx.customerFirstName} ${tx.customerLastName}`} 
                            onSuccess={fetchTxs} 
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function ManualAdjustmentDialog({ customerId, customerName, onSuccess }: { customerId: string, customerName: string, onSuccess: () => void }) {
  const [amountStr, setAmountStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

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
      <DialogTrigger render={<Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 transition-colors" />}>
        Düzeltme Yap
      </DialogTrigger>
      <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-md shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Manuel Puan Düzeltme</DialogTitle>
          <DialogDescription className="text-neutral-400 pt-2">
            Şu anda <strong className="text-emerald-400">{customerName}</strong> isimli müşterinin puanına manuel müdahale ediyorsunuz. Bu işlem yöneticiler tarafından loglanır.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <div className="space-y-3">
            <Label className="text-neutral-300">Düzeltilecek Tutar (Puan/TL)</Label>
            <div className="flex gap-2">
              <Input 
                type="number" 
                value={amountStr} 
                onChange={(e) => setAmountStr(e.target.value)} 
                placeholder="Örn: 50" 
                className="bg-neutral-950 border-neutral-800 focus-visible:ring-blue-500 text-lg h-12"
              />
              <div className="bg-neutral-800 border border-neutral-700 flex items-center px-4 rounded-md text-neutral-400 font-bold">₺</div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
          <Button variant="outline" className="border-red-900/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300" disabled={loading || !amountStr} onClick={() => handleAdjust(false)}>
            Puan Düş (-)
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white" disabled={loading || !amountStr} onClick={() => handleAdjust(true)}>
            Puan Ekle (+)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
