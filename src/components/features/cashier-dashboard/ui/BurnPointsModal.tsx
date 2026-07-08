import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calculator, Coins, Loader2, Wallet, ArrowRight, Tag, CheckCircle2 } from "lucide-react";
import { burnPointsAction } from "@/app/(cashier)/cashier-dashboard/actions";

interface EarnConfig {
  defaultEarnRatio: number;
  pointsEquivalent: number;
  tlEquivalent: number;
}

interface BurnPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    name: string;
    pts: number;
  } | null;
  config: EarnConfig | null;
  onSuccess?: (newTotal: number) => void;
}

export function BurnPointsModal({ isOpen, onClose, customer, config, onSuccess }: BurnPointsModalProps) {
  const [cartAmountText, setCartAmountText] = useState("");
  const [pointsToBurnText, setPointsToBurnText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCartAmountText("");
      setPointsToBurnText("");
      setError(null);
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen || !customer || !config) return null;

  const pointsEq = config.pointsEquivalent || 100;
  const tlEq = config.tlEquivalent || 1;

  const cartAmountNumber = parseFloat(cartAmountText) || 0;
  const pointsToBurnNumber = parseInt(pointsToBurnText) || 0;

  // Hesaplamalar
  const cartAmountInKurus = Math.floor(cartAmountNumber * 100);
  const maxPointsByCart = Math.floor((cartAmountNumber * pointsEq) / tlEq); // Sepetin tamamını ödemek için gereken max puan
  const availablePoints = customer.pts;
  const maxBurnablePoints = Math.min(availablePoints, maxPointsByCart);

  const discountInTl = (pointsToBurnNumber / pointsEq) * tlEq;
  const remainingCartAmount = Math.max(0, cartAmountNumber - discountInTl);

  const handleUseAll = () => {
    if (cartAmountNumber <= 0) {
      setError("Önce alışveriş tutarını giriniz.");
      return;
    }
    setPointsToBurnText(maxBurnablePoints.toString());
    setError(null);
  };

  const handleBurnPoints = async () => {
    if (cartAmountNumber <= 0) {
      setError("Geçerli bir alışveriş tutarı girin.");
      return;
    }
    if (pointsToBurnNumber <= 0) {
      setError("Geçerli bir puan tutarı girin.");
      return;
    }
    if (pointsToBurnNumber > availablePoints) {
      setError("Müşterinin yeterli puanı yok.");
      return;
    }
    // Burada backend'e totalCartAmount olarak Puan cinsinden sepet tutarını yolluyoruz, çünkü backend puan ile puanı kıyaslıyor.
    // actions.ts'de: if (pointsToBurn > totalCartAmount) var.
    const cartAmountInPoints = Math.floor((cartAmountNumber * pointsEq) / tlEq);

    if (pointsToBurnNumber > cartAmountInPoints) {
      setError("Harcanacak puan, sepet tutarını aşamaz.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await burnPointsAction(customer.id, pointsToBurnNumber, cartAmountInPoints);

    if (res && !res.success) {
      setError(res.error || "İşlem başarısız.");
      setIsSubmitting(false);
    } else if (res && res.success) {
      setIsSubmitting(false);
      setIsSuccess(true);
      if (onSuccess && res.newTotal !== undefined) {
        onSuccess(res.newTotal);
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  if (isSuccess) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-sm bg-emerald-950/90 border border-emerald-500/30 shadow-2xl shadow-emerald-900/20 rounded-2xl p-8 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">İşlem Başarılı!</h3>
            <p className="text-emerald-200/80 text-sm">Puan harcama işlemi tamamlandı.</p>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-slate-900 border border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/5 bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Puan Harcama (Redeem)</h3>
                <p className="text-xs text-slate-400">{customer.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 flex-1 overflow-y-auto space-y-6">
            
            {/* Customer Points Info */}
            <div className="bg-gradient-to-r from-rose-500/10 to-transparent p-4 rounded-xl border border-rose-500/20 flex justify-between items-center">
              <div>
                <p className="text-xs text-rose-400/80 mb-1">Müşteri Puan Bakiyesi</p>
                <div className="text-2xl font-bold text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  {customer.pts.toLocaleString("tr-TR")}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">Puan Değeri</p>
                <div className="text-lg font-medium text-slate-300">
                  {((customer.pts / pointsEq) * tlEq).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  Alışveriş Tutarı (TL)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Tag className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cartAmountText}
                    onChange={(e) => setCartAmountText(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-mono text-lg"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-medium">₺</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Harcanacak Puan
                  </label>
                  <button 
                    onClick={handleUseAll}
                    type="button"
                    className="text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors py-1 px-2 bg-rose-500/10 rounded-lg"
                  >
                    Tümünü Kullan
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Coins className="w-4 h-4 text-amber-400/50" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={pointsToBurnText}
                    onChange={(e) => setPointsToBurnText(e.target.value)}
                    placeholder="0"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-amber-400 font-bold placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-lg"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Summary */}
            {cartAmountNumber > 0 && pointsToBurnNumber > 0 && pointsToBurnNumber <= availablePoints && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-3"
              >
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Sepet Tutarı:</span>
                  <span className="text-slate-300 font-medium">{cartAmountNumber.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-rose-400">Puan İndirimi:</span>
                  <span className="text-rose-400 font-medium">-{discountInTl.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                </div>
                <div className="h-px bg-white/10 w-full" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-medium">Ödenecek Tutar:</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {remainingCartAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>
                <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-start gap-2">
                  <div className="mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-sm text-emerald-200">
                    Müşterinizin hesabından <b>{pointsToBurnNumber} Puan</b> eksiltilecek ve toplam sepet tutarından <b>{discountInTl.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</b> indirim sağlanacaktır. İşlemi tamamlamak için kasadan <span className="font-bold underline">{remainingCartAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span> tahsil etmeniz gerekmektedir.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-white/5 bg-slate-800/30 flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-300 hover:bg-white/5 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleBurnPoints}
              disabled={isSubmitting || cartAmountNumber <= 0 || pointsToBurnNumber <= 0 || pointsToBurnNumber > availablePoints}
              className="flex-[2] bg-rose-600 hover:bg-rose-500 text-white px-4 py-3 rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  Puanı Harca
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
