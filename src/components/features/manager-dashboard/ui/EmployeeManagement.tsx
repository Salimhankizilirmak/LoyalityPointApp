"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit3, Trash2, Check, X, ShieldCheck, Mail } from "lucide-react";
import { Employee } from "../types";

interface EmployeeManagementProps {
  employees: Employee[];
  isDarkMode: boolean;
  onUpdate?: (id: string, firstName: string, lastName: string) => Promise<void>;
  onRemove?: (id: string) => Promise<void>;
  onToggleStatus?: (id: string, currentStatus: boolean) => Promise<void>;
  loadingId: string | null;
}

export function EmployeeManagement({
  employees,
  isDarkMode,
  onUpdate,
  onRemove,
  onToggleStatus,
  loadingId
}: EmployeeManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const startEdit = (emp: Employee) => {
    const parts = emp.name.split(" ");
    setFirstName(parts[0] || "");
    setLastName(parts.slice(1).join(" ") || "");
    setEditingId(emp.id);
  };

  const saveEdit = async (id: string) => {
    if (onUpdate) {
      await onUpdate(id, firstName, lastName);
    }
    setEditingId(null);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || "";
  };

  // PENDING olanları listenin başına alalım
  const sortedEmployees = [...employees.filter(e => e.role !== "boss")].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
          Ekip Üyeleri & Kasiyerler
        </h3>
        <p className="text-slate-500 text-xs mt-0.5">
          Şubenizde aktif veya davet aşamasındaki personeller.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {sortedEmployees.map((emp, i) => {
            const isPending = emp.status === "pending";
            const isSuspended = emp.status === "suspended";
            const isActive = emp.status === "active";

            return (
              <motion.div
                key={emp.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                className={`p-5 rounded-3xl border transition-all ${
                  isDarkMode 
                    ? "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-white" 
                    : "bg-white border-slate-100 shadow-sm hover:shadow-md text-slate-800"
                } ${isSuspended ? "opacity-60" : ""}`}
              >
                <div className="flex flex-col gap-4">
                  {/* Üst Kısım: Profil Resmi/Avatar ve İsim */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {emp.avatar ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={emp.avatar} 
                          alt={emp.name} 
                          className="w-12 h-12 rounded-2xl object-cover border border-cyan-500/10" 
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold bg-gradient-to-tr ${
                          isDarkMode 
                            ? "from-cyan-900/30 to-indigo-900/30 text-cyan-300 border border-cyan-500/10" 
                            : "from-cyan-500 to-indigo-500 text-white shadow-md"
                        }`}>
                          {getInitials(emp.name)}
                        </div>
                      )}
                      
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${
                        isDarkMode ? "border-slate-900" : "border-white"
                      }`} style={{ 
                        background: isPending ? "#f59e0b" : isSuspended ? "#ef4444" : "#22c55e" 
                      }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingId === emp.id ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              value={firstName}
                              onChange={e => setFirstName(e.target.value)}
                              placeholder="Ad"
                              className={`w-full px-2 py-1 rounded-lg text-xs border outline-none ${
                                isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                              }`}
                            />
                            <input
                              value={lastName}
                              onChange={e => setLastName(e.target.value)}
                              placeholder="Soyad"
                              className={`w-full px-2 py-1 rounded-lg text-xs border outline-none ${
                                isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                              }`}
                            />
                          </div>
                          <div className="flex gap-1.5 justify-end">
                            <button 
                              onClick={() => saveEdit(emp.id)} 
                              className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={() => setEditingId(null)} 
                              className="p-1 rounded-lg bg-slate-500/10 text-slate-500 hover:bg-slate-500/20"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold truncate">{emp.name}</p>
                            {emp.role === "manager" && <ShieldCheck size={13} className="text-cyan-500" />}
                          </div>
                          <p className="text-slate-500 text-[11px] truncate">{emp.email}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Alt Kısım: Detaylar ve Butonlar */}
                  <div className="flex items-center justify-between border-t border-slate-500/10 pt-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        emp.role === "manager" ? "bg-cyan-500/10 text-cyan-500" : "bg-indigo-500/10 text-indigo-500"
                      }`}>
                        {emp.role === "manager" ? "Yönetici" : "Kasiyer"}
                      </span>

                      {isPending && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 flex items-center gap-1">
                          <Mail size={10} /> Davet Bekliyor
                        </span>
                      )}

                      {isSuspended && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500">
                          Askıda
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Onaylanan Toplam İşlem Sayısı */}
                      {!isPending && (
                        <div className="text-right">
                          <span className="text-[9px] text-slate-500 block leading-none">İşlemler</span>
                          <strong className="font-extrabold text-xs">{emp.txCount || 0}</strong>
                        </div>
                      )}

                      {/* Active/Suspended Switch */}
                      {!isPending && onToggleStatus && (
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => onToggleStatus(emp.id, isActive)}
                            disabled={loadingId === emp.id}
                            className={`relative w-8 h-4.5 rounded-full transition-colors flex items-center ${
                              isActive ? "bg-cyan-500" : "bg-slate-600"
                            } ${loadingId === emp.id ? "opacity-50 cursor-not-allowed" : ""}`}
                            aria-label="Aktiflik Durumu Değiştir"
                          >
                            <motion.div 
                              animate={{ x: isActive ? 14 : 2 }}
                              className="w-3.5 h-3.5 rounded-full bg-white shadow-sm"
                            />
                          </button>
                        </div>
                      )}

                      {/* Edit / Remove Butonları */}
                      <div className="flex items-center gap-1 border-l border-slate-500/10 pl-2">
                        {onUpdate && !isPending && (
                          <button 
                            onClick={() => startEdit(emp)} 
                            className="p-1 rounded hover:bg-slate-500/10 text-slate-400 hover:text-blue-500 transition-all"
                            aria-label="Düzenle"
                          >
                            <Edit3 size={13} />
                          </button>
                        )}
                        {onRemove && (
                          <button 
                            onClick={() => onRemove(emp.id)} 
                            disabled={loadingId === emp.id}
                            className="p-1 rounded hover:bg-slate-500/10 text-slate-400 hover:text-rose-500 transition-all"
                            aria-label="Sil"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

