"use client";

import { useState, useEffect } from "react";
import { Share, PlusSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const isBrowser = typeof window !== "undefined";
    if (!isBrowser) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    
    // Detect standalone
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      ('standalone' in window.navigator && (window.navigator as any).standalone === true);

    // Check if dismissed
    const dismissed = localStorage.getItem("ios-install-prompt-dismissed");

    if (isIOSDevice && !isStandaloneMode && !dismissed) {
      // Delay showing prompt to not interrupt immediate loading
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem("ios-install-prompt-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-[9999] p-4 bg-background border border-border rounded-xl shadow-2xl flex flex-col gap-3 sm:max-w-sm sm:mx-auto"
        >
          <button 
            onClick={dismissPrompt}
            className="absolute top-2 right-2 p-1 text-muted-foreground hover:bg-muted rounded-full transition-colors"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex flex-col gap-2 pt-2">
            <h3 className="font-semibold text-foreground text-sm">Uygulamayı Ana Ekrana Ekleyin</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Daha hızlı erişim ve daha iyi bir deneyim için Okut Kazan&apos;ı telefonunuza yükleyebilirsiniz.
            </p>
          </div>

          <div className="flex flex-col gap-2 mt-2 bg-muted/50 p-3 rounded-lg text-xs text-foreground">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-background rounded shadow-sm font-medium">1</span>
              <span>Tarayıcının alt kısmındaki <Share className="w-3.5 h-3.5 inline text-blue-500 mx-1" /> <b>Paylaş</b> ikonuna dokunun.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-background rounded shadow-sm font-medium">2</span>
              <span>Açılan menüde <PlusSquare className="w-3.5 h-3.5 inline text-foreground mx-1" /> <b>Ana Ekrana Ekle</b> (Add to Home Screen) seçeneğini seçin.</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
