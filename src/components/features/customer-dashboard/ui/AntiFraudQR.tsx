"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";

export function AntiFraudQR() {
  const [timeLeft, setTimeLeft] = useState(60);
  const [qrToken, setQrToken] = useState(() => {
    const randomPart = Math.random().toString(36).substring(2, 15).toUpperCase();
    return `ANTIFRAUD-QR-${randomPart}`;
  });

  // QR Token Generator
  const generateNewToken = () => {
    const randomPart = Math.random().toString(36).substring(2, 15).toUpperCase();
    setQrToken(`ANTIFRAUD-QR-${randomPart}`);
  };

  // 60 Saniye Geri Sayım ve Token Yenileme Motoru
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateNewToken();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Dairesel Geri Sayım Çevresi Hesabı (r=18 için 2 * PI * r = 113.1)
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / 60) * circumference;

  return (
    <div className="rounded-3xl border border-slate-900 bg-[#070913]/90 p-7 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent pointer-events-none" />

      {/* QR Kod Başlığı */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shadow-[0_0_8px_rgba(34,211,238,0.8)] shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          Anti-Fraud Reaktif QR Kod
        </span>
      </div>

      {/* QR Kod Çerçevesi */}
      <div className="relative p-5 rounded-2xl bg-white border border-cyan-400/20 shadow-[0_0_25px_rgba(34,211,238,0.1)] group-hover:scale-[1.01] transition-transform duration-300">
        {qrToken ? (
          <QRCodeSVG
            value={qrToken}
            size={170}
            level="Q"
            fgColor="#020617"
            bgColor="#ffffff"
          />
        ) : (
          <div className="w-[170px] h-[170px] flex items-center justify-center bg-slate-900 rounded-xl">
            <QrCode size={40} className="text-slate-700 animate-pulse" />
          </div>
        )}
      </div>

      {/* QR Bilgilendirme */}
      <p className="text-[10px] text-slate-500 leading-relaxed mt-5 max-w-[280px]">
        Kasiyere puan yükletmek veya harcatmak için bu QR kodu gösterin. Güvenliğiniz için bu kod her 60 saniyede bir otomatik yenilenir.
      </p>

      {/* Geri Sayım Animasyonu & Sayacı */}
      <div className="flex items-center gap-3.5 mt-5 px-4.5 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="relative w-10 h-10 flex items-center justify-center">
          <svg className="w-10 h-10 transform -rotate-90">
            <circle
              cx="20"
              cy="20"
              r={radius}
              className="text-slate-800"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="20"
              cy="20"
              r={radius}
              className="text-cyan-400 transition-all duration-1000 ease-linear"
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <span className="absolute text-[11px] font-black text-cyan-400 font-mono">
            {timeLeft}
          </span>
        </div>
        
        <div className="flex flex-col items-start text-left">
          <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest font-mono leading-none">
            Anti-Fraud Shield
          </span>
          <span className="text-[9px] text-slate-500 mt-1">
            Kodun geçerlilik süresi
          </span>
        </div>
      </div>
    </div>
  );
}
export default AntiFraudQR;
