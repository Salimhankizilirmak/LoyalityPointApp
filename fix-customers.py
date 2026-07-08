import re

file_path = "src/app/(cashier)/cashier-dashboard/customers/customers-client.tsx"

new_content = """"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Search, RefreshCw, Check, Edit2, X as CloseIcon, Users as UsersIcon } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { getBranchCustomerInvitationsAction, updateCustomerNameAction } from "../actions";
import { CashierDashboardModals } from "@/components/features/cashier-dashboard/modals/CashierDashboardModals";

interface CashierInfo {
  name: string;
  email: string;
  branchName: string;
}

interface CustomersClientPageProps {
  cashierInfo: CashierInfo;
}

// Avatar Initials Helper
function getInitials(name?: string | null) {
  if (!name || name.trim() === "") return "İ"; // İsimsiz için İ
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Renk Belirleme Helper
function getAvatarColor(name?: string | null) {
  if (!name) return "bg-indigo-500 text-white";
  const colors = [
    "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-green-500",
    "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-sky-500",
    "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500",
    "bg-fuchsia-500", "bg-pink-500", "bg-rose-500"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `${colors[Math.abs(hash) % colors.length]} text-white`;
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

  // Inline Edit States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  const handleEditStart = (id: string, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName || "");
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleEditSave = async (id: string, phoneNumber: string) => {
    if (!editValue.trim()) return handleEditCancel();
    
    setIsSaving(true);
    try {
      const res = await updateCustomerNameAction(phoneNumber, editValue);
      if (res.success) {
        setInvitations(prev => prev.map(inv => 
          inv.id === id ? { ...inv, customerName: editValue.trim() } : inv
        ));
      } else {
        alert("İsim güncellenemedi: " + (res.error || "Bilinmeyen hata"));
      }
    } catch (err) {
      alert("Hata oluştu.");
    } finally {
      setIsSaving(false);
      setEditingId(null);
    }
  };

  const filtered = invitations.filter((invite) => {
    if (!customerSearchQuery.trim()) return true;
    const q = customerSearchQuery.toLowerCase().trim();
    const nameMatch = (invite.customerName || "").toLowerCase().includes(q);
    const emailMatch = (invite.email || "").toLowerCase().includes(q);
    const phoneMatch = (invite.phoneNumber || "").toLowerCase().includes(q);
    return nameMatch || emailMatch || phoneMatch;
  });

  return (
    <div className={`min-h-screen flex flex-col font-sans select-none antialiased transition-colors duration-300 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      <CashierDashboardModals
        branchStatus={null}
        showAddCustomer={false}
        setShowAddCustomer={() => { }}
        handleAddCustomer={async () => { }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Şube Müşterileri
            </h2>
            <p className={`text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Kayıtlı müşteriler ve davet durumları
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={customerSearchQuery}
              onChange={(e) => setCustomerSearchQuery(e.target.value)}
              placeholder="Ad, e-posta veya telefon ara..."
              className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none transition-all placeholder-slate-500 min-h-[42px] ${
                isDarkMode
                  ? "bg-slate-900/50 border-white/10 text-white focus:border-indigo-500"
                  : "bg-white border-slate-200 text-slate-900 focus:border-indigo-500"
              }`}
            />
          </div>
        </div>

        {invitationsLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Yükleniyor...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto ${isDarkMode ? "bg-slate-900" : "bg-slate-100"}`}>
              <UsersIcon className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className={`text-lg font-bold mb-1 ${isDarkMode ? "text-white" : "text-slate-800"}`}>Müşteri Bulunamadı</h3>
            <p className="text-sm text-slate-500">Arama kriterlerinize uyan kayıt bulunamadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((invite) => {
              const isAccepted = invite.status === "ACCEPTED";
              const displayName = invite.customerName || "İsimsiz Müşteri";
              const isEditing = editingId === invite.id;

              return (
                <div 
                  key={invite.id} 
                  className={`flex flex-col p-5 rounded-3xl border shadow-sm transition-all hover:shadow-md ${
                    isDarkMode ? "bg-slate-900/40 border-white/5 hover:border-white/10" : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${getAvatarColor(invite.customerName)}`}>
                      {getInitials(invite.customerName)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1 w-full">
                          <input 
                            autoFocus
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditSave(invite.id, invite.phoneNumber);
                              if (e.key === "Escape") handleEditCancel();
                            }}
                            className={`w-full px-2 py-1 text-sm font-bold rounded border outline-none min-w-0 ${
                              isDarkMode ? "bg-slate-950 border-indigo-500/50 text-white" : "bg-slate-50 border-indigo-300 text-slate-900"
                            }`}
                          />
                          <button 
                            disabled={isSaving}
                            onClick={() => handleEditSave(invite.id, invite.phoneNumber)}
                            className="p-1 shrink-0 rounded bg-indigo-500 text-white hover:bg-indigo-600 transition"
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            disabled={isSaving}
                            onClick={handleEditCancel}
                            className={`p-1 shrink-0 rounded transition ${isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`}
                          >
                            <CloseIcon size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <h3 className={`font-bold truncate ${isDarkMode ? "text-slate-100" : "text-slate-800"}`} title={displayName}>
                            {displayName}
                          </h3>
                          {invite.phoneNumber && (
                            <button 
                              onClick={() => handleEditStart(invite.id, invite.customerName)}
                              className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition"
                              title="İsmi Düzenle"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                        </div>
                      )}
                      
                      <p className={`text-xs truncate ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                        {invite.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3 pt-4 border-t border-slate-500/10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Telefon:</span>
                      <span className="font-mono font-medium">{invite.phoneNumber || "Belirtilmemiş"}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Durum:</span>
                      {isAccepted ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-bold uppercase tracking-wider text-[10px]">
                          Kayıtlı
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 font-bold uppercase tracking-wider text-[10px]">
                          Bekliyor
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Puan:</span>
                      <span className={`font-mono font-black ${isAccepted ? "text-indigo-500" : "text-slate-400"}`}>
                        {isAccepted ? `${invite.totalPoints ?? 0} Pts` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
"""

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

