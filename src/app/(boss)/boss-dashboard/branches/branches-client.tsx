"use client";

import { AlertTriangle, Store, Mail, Phone, MoreVertical } from "lucide-react";
import { BossInfo, Branch, Employee } from "@/components/features/boss-dashboard/types";
import { useState } from "react";
import { AddBranchModal } from "@/components/features/boss-dashboard/ui/AddBranchModal";
import { createBranch } from "../actions";
import { useRouter } from "next/navigation";

interface BranchesClientProps {
  profile: BossInfo | null;
  branches: Branch[];
  members: Employee[];
}

export function BranchesClient({ profile, branches, members }: BranchesClientProps) {
  const router = useRouter();
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentBranches = profile?.currentBranches || branches.length;
  const branchLimit = profile?.branchLimit || 1;
  const isQuotaLimitReached = currentBranches >= branchLimit;

  const handleAddBranch = async (data: { name: string; city: string }) => {
    try {
      await createBranch(data.name, data.city);
      setShowAddBranch(false);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Şube oluşturulurken bir hata oluştu.");
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {isQuotaLimitReached && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-rose-500 font-bold text-sm">Şube kotanız dolmuştur ({currentBranches}/{branchLimit}).</h3>
            <p className="text-rose-400/80 text-sm mt-1">
              Yeni şube yuvası satın almak için <a href="mailto:novexitech@gmail.com?subject=Yeni%20Şube%20Satın%20Alma%20Talebi&body=Merhaba%2C%0A%0AYeni%20şube%20satın%20almak%20istiyoruz.%20Lütfen%20fiyatlandırma%20ve%20detaylar%20hakkında%20bilgi%20verir%20misiniz%3F" className="font-bold underline hover:text-rose-300">Novexistech</a> ile iletişime geçin.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((branch) => {
          // find manager
          const manager = members.find((m) => m.name === branch.manager || m.id === branch.manager) || null;
          
          return (
            <div key={branch.id} className="bg-slate-900 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Store className="text-indigo-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{branch.name}</h3>
                    <p className="text-xs text-slate-400">{branch.city}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${branch.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                  {branch.status === "active" ? "Aktif" : "Pasif"}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Yönetici Bilgisi</p>
                {manager ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 overflow-hidden shrink-0">
                      {manager.avatar && !manager.avatar.includes("?") ? (
                        <img src={manager.avatar} alt={manager.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase">
                          {manager.name !== manager.email ? manager.name.charAt(0) : "Y"}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-200 truncate">
                        {manager.name === manager.email ? "İsimsiz Yönetici" : manager.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{manager.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Yönetici atanmamış</p>
                )}
              </div>
            </div>
          );
        })}
        {branches.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-2xl">
            <Store className="mx-auto text-slate-600 mb-3" size={32} />
            <h3 className="text-slate-300 font-bold">Henüz şube yok</h3>
            <p className="text-slate-500 text-sm mt-1">Sisteminizde kayıtlı bir şube bulunmuyor.</p>
          </div>
        )}

        {/* Yeni Şube Ekle Kartı */}
        <div 
          onClick={() => !isQuotaLimitReached && setShowAddBranch(true)}
          className={`border border-dashed rounded-2xl p-5 flex flex-col items-center justify-center min-h-[200px] transition-colors ${
            isQuotaLimitReached 
              ? "bg-slate-900/50 border-white/5 opacity-50 cursor-not-allowed" 
              : "bg-slate-900/20 border-indigo-500/30 hover:border-indigo-500 hover:bg-indigo-500/5 cursor-pointer"
          }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
            isQuotaLimitReached ? "bg-slate-800 text-slate-500" : "bg-indigo-500/10 text-indigo-400"
          }`}>
            <Store size={24} />
          </div>
          <h3 className={`font-bold ${isQuotaLimitReached ? "text-slate-500" : "text-white"}`}>
            Yeni Şube Ekle
          </h3>
          {isQuotaLimitReached && (
            <p className="text-xs text-slate-500 mt-2 text-center">
              Şube kotanız dolmuştur.
            </p>
          )}
        </div>
      </div>

      {showAddBranch && (
        <AddBranchModal
          isDarkMode={true}
          onClose={() => setShowAddBranch(false)}
          onAdd={handleAddBranch}
        />
      )}

      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] px-6 py-3 bg-rose-500 text-white rounded-xl shadow-lg font-medium text-sm animate-in fade-in slide-in-from-top-4">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
