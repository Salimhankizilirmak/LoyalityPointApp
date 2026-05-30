"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";

import { QrCode } from "lucide-react";

export function CustomerQrCard({ userId }: { userId: string }) {
  return (
    <section aria-label="Scan to Earn" className="flex flex-col items-center justify-center py-4">
      <div className="relative w-full">
        <div className="absolute -inset-4 bg-primary/20 rounded-[2rem] blur-xl animate-[pulse_3s_ease-in-out_infinite]"></div>
        <div className="relative z-10 glass-card rounded-[1.5rem] p-6 flex flex-col items-center gap-4 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300">
          <div className="w-56 h-56 bg-white rounded-xl p-3 flex items-center justify-center">
            <QRCodeSVG 
              value={userId || ""} 
              size={200}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
              marginSize={0}
              imageSettings={{
                src: "/icons/icon-192x192.png", 
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>
          <div className="flex items-center gap-2 text-on-surface">
            <QrCode className="text-primary w-6 h-6" />
            <span className="font-headline-md text-[20px] font-semibold tracking-tight">Scan to Earn</span>
          </div>
          <p className="text-xs text-on-surface-variant/70 tracking-[0.2em] font-mono uppercase">
            ID: {userId.split('_')[1] || userId}
          </p>
        </div>
      </div>
    </section>
  );
}
