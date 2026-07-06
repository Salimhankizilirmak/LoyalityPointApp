"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Search, RefreshCw } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { getBranchCustomerInvitationsAction } from "../actions";
import { CashierDashboardModals } from "@/components/features/cashier-dashboard/modals/CashierDashboardModals";


interface CashierInfo {
  name: string;
  email: string;
  branchName: string;
}

interface CustomersClientPageProps {
  cashierInfo: CashierInfo;
}

export function CustomersClientPage({ cashierInfo }: CustomersClientPageProps) {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();

  // Theme
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Data States
  const [invitations, setInvitations] = useState<any[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");

  const loadInvitations = useCallback(async () => {
    setInvitationsLoading(true);
    try {
      const res = await getBranchCustomerInvitationsAction();
      if (res.success && res.invitations) {
        setInvitations(res.invitations);
      }
    } catch (err) {
      console.error("Davetler yüklenirken hata oluştu:", err);
    } finally {
      setInvitationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  return (
    <div className={`min-h-screen flex flex-col font-sans select-none antialiased transition-colors duration-300 ${isDarkMode ? "bg-neutral-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      {/* Oturum Kapama Modalı */}
      <CashierDashboardModals
        branchStatus={null}
        showAddCustomer={false}
        setShowAddCustomer={() => { }}
        handleAddCustomer={async () => { }}
      />

      {/* Ortak Navigasyon Header */}


      {/* 📊 Ana Bölüm Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* 👥 Müşteriler ve Davetler Tablosu */}
        <GlassPanel className="p-6 bg-neutral-900/60 border-indigo-500/15 shadow-xl relative overflow-hidden" elevated>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Şube Müşterileri ve Davetleri</h2>
              <p className="text-[10px] text-slate-500 mt-1">Şubeye ait tüm davet ve kayıt durumları</p>
            </div>
            <div className="relative group w-full sm:w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Ad, e-posta veya telefon ara..."
                className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs outline-none transition-all placeholder-slate-600 min-h-[38px] ${isDarkMode
                    ? "bg-[#09090b]/80 border-white/10 text-white focus:border-indigo-500 focus:shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                    : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                  }`}
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
                  <th className="p-4">Ad / E-posta</th>
                  <th className="p-4">Telefon</th>
                  <th className="p-4 text-center">Durum</th>
                  <th className="p-4 text-right pr-6">Puan</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-white/5">
                {invitationsLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-20 text-slate-500 font-bold uppercase tracking-wider">
                      <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-2" />
                      Yükleniyor...
                    </td>
                  </tr>
                ) : (() => {
                  const filtered = invitations.filter((invite) => {
                    if (!customerSearchQuery.trim()) return true;
                    const q = customerSearchQuery.toLowerCase().trim();
                    const nameMatch = (invite.customerName || "").toLowerCase().includes(q);
                    const emailMatch = (invite.email || "").toLowerCase().includes(q);
                    const phoneMatch = (invite.phoneNumber || "").toLowerCase().includes(q);
                    return nameMatch || emailMatch || phoneMatch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={4} className="text-center py-20 text-slate-500 font-bold uppercase tracking-wider">
                          Henüz davet veya kayıt bulunmuyor.
                        </td>
                      </tr>
                    );
                  }

                  return filtered.map((invite) => {
                    const isAccepted = invite.status === "ACCEPTED";
                    return (
                      <tr key={invite.id} className="transition-colors border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-4">
                          <div className="font-bold text-slate-200">
                            {invite.customerName || "İsimsiz Müşteri"}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{invite.email}</div>
                        </td>
                        <td className="p-4 font-mono font-medium text-slate-300">
                          {invite.phoneNumber || "Belirtilmemiş"}
                        </td>
                        <td className="p-4 text-center">
                          {isAccepted ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                              KABUL EDİLDİ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                              BEKLEYEN
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right pr-6 font-mono font-bold text-indigo-400">
                          {isAccepted ? `${invite.totalPoints ?? 0} Puan` : "—"}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      </main>
    </div>
  );
}
