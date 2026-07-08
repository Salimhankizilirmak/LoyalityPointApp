"use client";

import { useState, useEffect } from "react";
import { Check, X, User } from "lucide-react";
import { approveQrRequestAction, rejectQrRequestAction, getPendingQrRequestsAction } from "../actions";

interface RequestItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: number;
}

export function ApprovalsClient({ initialRequests }: { initialRequests: RequestItem[] }) {
  const [requests, setRequests] = useState<RequestItem[]>(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Polling mechanism
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await getPendingQrRequestsAction();
      if (res.success && res.data) {
        const formattedRequests = res.data.map((req: any) => ({
          id: req.id,
          name: `${req.firstName} ${req.lastName}`,
          email: req.email,
          phone: req.phoneNumber,
          createdAt: Math.floor(new Date(req.createdAt).getTime() / 1000)
        }));
        setRequests(formattedRequests);
      }
    }, 10000); // 10 saniyede bir

    return () => clearInterval(interval);
  }, []);

  const onAction = async (id: string, action: "APPROVE" | "REJECT") => {
    setLoadingId(id);
    try {
      let res;
      if (action === "APPROVE") {
        res = await approveQrRequestAction(id);
      } else {
        res = await rejectQrRequestAction(id);
      }
      
      if (res.success) {
        setRequests(requests.filter(r => r.id !== id));
      } else {
        alert(res.error || "İşlem sırasında hata oluştu");
      }
    } catch (err) {
      alert("Bir hata oluştu");
    } finally {
      setLoadingId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="text-slate-500" size={32} />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">Onay Bekleyen Müşteri Yok</h3>
        <p className="text-slate-400">Şu anda onayınızı bekleyen yeni bir müşteri kaydı bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {requests.map(req => (
        <div key={req.id} className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-white/10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-blue-400">{req.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{req.name}</h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-slate-400 mt-1">
                <span>{req.phone}</span>
                <span className="hidden sm:inline">•</span>
                <span>{req.email}</span>
                <span className="hidden sm:inline">•</span>
                <span>{new Date(req.createdAt * 1000).toLocaleString("tr-TR")}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <button
              onClick={() => onAction(req.id, "REJECT")}
              disabled={loadingId === req.id}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium transition-colors disabled:opacity-50"
            >
              <X size={18} />
              <span>Reddet</span>
            </button>
            <button
              onClick={() => onAction(req.id, "APPROVE")}
              disabled={loadingId === req.id}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-medium transition-colors disabled:opacity-50"
            >
              <Check size={18} />
              <span>Onayla</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
