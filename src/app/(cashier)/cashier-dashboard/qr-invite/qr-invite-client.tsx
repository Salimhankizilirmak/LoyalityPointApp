"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Download, Share2 } from "lucide-react";
import { motion } from "framer-motion";

interface QrInviteClientProps {
  branchId: string;
  appUrl: string;
}

export function QrInviteClient({ branchId, appUrl }: QrInviteClientProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [actualBranchId, setActualBranchId] = useState(branchId);

  useEffect(() => {
    // Kasiyer dashboard'da SSR'da cookie bazen tam okunamayabilir, istemci tarafında cookie'den yakala
    if (!actualBranchId && typeof document !== "undefined") {
      const match = document.cookie.match(/(^| )active_branch_id=([^;]+)/);
      if (match) setActualBranchId(match[2]);
    }
  }, [actualBranchId]);

  // Parametreli sabit QR url'si:
  // Not: her zaman sunucudan gelen appUrl (production domain) kullanılacak.
  const qrUrl = `${appUrl}/q/${actualBranchId}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Sol: QR Kartı */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />

        <div className="bg-white p-6 rounded-2xl shadow-xl mb-6 relative z-10 print:shadow-none print:p-0">
          <QRCodeSVG
            value={qrUrl}
            size={256}
            level="H" // High error correction
            includeMargin={true}
          />
        </div>

        <h2 className="text-xl font-bold text-white mb-2 print:hidden">Müşteri Kayıt QR Kodu</h2>
        <p className="text-slate-400 text-center text-sm max-w-sm mb-8 print:hidden">
          Müşteriniz telefonunun kamerasıyla bu kodu okutarak kayıt formuna ulaşabilir.
        </p>

        <div className="flex items-center gap-3 w-full max-w-sm print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
          >
            <Printer size={18} />
            <span>Yazdır</span>
          </button>
            <button
              onClick={handleCopyLink}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                isCopied
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-cyan-500 text-slate-950 hover:bg-cyan-600"
              }`}
            >
              {isCopied ? (
                <>
                  <span>Kopyalandı!</span>
                </>
              ) : (
                <>
                  <Share2 size={18} />
                  <span>Linki Kopyala</span>
                </>
              )}
            </button>
        </div>
      </motion.div>

      {/* Sağ: Bilgi / Adımlar */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6 print:hidden"
      >
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Nasıl Çalışır?</h3>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold shrink-0">1</div>
              <p className="text-slate-300 text-sm pt-1">Bu QR kodunu müşterinize gösterin veya çıktısını alıp kasaya yerleştirin.</p>
            </li>
            <li className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold shrink-0">2</div>
              <p className="text-slate-300 text-sm pt-1">Müşteri telefon kamerasıyla kodu okutarak forma ulaşır ve bilgilerini doldurur.</p>
            </li>
            <li className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold shrink-0">3</div>
              <p className="text-slate-300 text-sm pt-1">İstek <span className="font-semibold text-white">"Onay Bekleyenler"</span> sekmesine düşer.</p>
            </li>
            <li className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold shrink-0">4</div>
              <p className="text-slate-300 text-sm pt-1">Siz onayladıktan sonra müşterinin telefonunda otomatik olarak şifre belirleme ekranı açılır.</p>
            </li>
          </ul>
        </div>


      </motion.div>
    </div>
  );
}
