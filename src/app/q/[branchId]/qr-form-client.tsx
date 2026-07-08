"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createQrRequestAction, checkQrRequestStatusAction } from "./actions";
import { CheckCircle2, XCircle, Clock, ArrowRight, Store, Loader2 } from "lucide-react";

export function QrFormClient({ branchId }: { branchId: string }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Status View State
  const [requestId, setRequestId] = useState<string | null>(null);
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "REJECTED" | null>(null);

  // Polling for status
  useEffect(() => {
    if (!requestId || status === "APPROVED" || status === "REJECTED") return;

    const interval = setInterval(async () => {
      const res = await checkQrRequestStatusAction(requestId);
      if (res.success) {
        if (res.status === "APPROVED") {
          setStatus("APPROVED");
          clearInterval(interval);
// SMS/Email otomatik gidiyor, ekranda bekle.
        } else if (res.status === "REJECTED") {
          setStatus("REJECTED");
          clearInterval(interval);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [requestId, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const res = await createQrRequestAction({
      branchId,
      ...formData,
    });

    if (res.success && res.requestId) {
      setRequestId(res.requestId);
      setStatus("PENDING");
    } else {
      setError(res.error || "İşlem başarısız oldu.");
    }
    setIsLoading(false);
  };

  const handleGoBack = () => {
    setRequestId(null);
    setStatus(null);
    setFormData({ firstName: "", lastName: "", email: "", phoneNumber: "" });
  };

  if (requestId) {
    return (
      <div className="w-full max-w-md mx-auto mt-12 p-8 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl">
        <AnimatePresence mode="wait">
          {status === "PENDING" && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center animate-pulse">
                <Clock className="w-10 h-10 text-amber-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Onay Bekleniyor</h2>
                <p className="text-slate-400">
                  Lütfen kasadaki görevlinin kaydınızı onaylamasını bekleyin. Onaylandığında otomatik olarak yönlendirileceksiniz.
                </p>
              </div>
              <Loader2 className="w-6 h-6 text-slate-500 animate-spin mt-4" />
            </motion.div>
          )}

          {status === "APPROVED" && (
            <motion.div
              key="approved"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Onaylandı!</h2>
                <p className="text-slate-400">
                  Kaydınız başarıyla onaylandı. Lütfen e-posta adresinize veya telefonunuza gelen davet bağlantısına tıklayarak şifrenizi belirleyin.
                </p>
              </div>
            </motion.div>
          )}

          {status === "REJECTED" && (
            <motion.div
              key="rejected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">İsteğiniz Reddedildi</h2>
                <p className="text-slate-400">
                  Kayıt isteğiniz görevli tarafından reddedildi.
                </p>
              </div>
              <button
                onClick={handleGoBack}
                className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
              >
                Geri Dön
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto mt-12 p-8 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-cyan-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Müşteri Kayıt Sistemi</h1>
        <p className="text-slate-400 text-sm">
          Aşağıdaki bilgileri doldurarak sisteme hızlıca dahil olabilirsiniz.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Ad</label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              placeholder="Adınız"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Soyad</label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              placeholder="Soyadınız"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">E-posta</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            placeholder="ornek@email.com"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Telefon Numarası</label>
          <input
            type="tel"
            required
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            placeholder="555 123 4567"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-6 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Kaydı Tamamla</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
