"use client";

import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

export default function PendingApprovalPage() {
  const { signOut } = useClerk();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleReturnHome = async () => {
    setLoading(true);
    await signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Onay Bekleniyor</h2>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Kayıt talebiniz mağaza yetkilisi tarafından inceleniyor. Onaylandığında sisteme giriş yapabileceksiniz.
        </p>
        <button 
          onClick={handleReturnHome}
          disabled={loading}
          className="inline-flex justify-center items-center bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors w-full disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Çıkış Yapılıyor...
            </>
          ) : (
            "Ana Sayfaya Dön"
          )}
        </button>
      </div>
    </div>
  );
}
