"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit3, Trash2, Check, X, ShieldCheck, Mail, Plus, UserCircle2, CalendarCheck, Users, Eye, ArrowUpRight, ArrowDownLeft, Ban, Clock } from "lucide-react";
import { Employee, Transaction } from "../types";

interface EmployeeManagementProps {
  employees: Employee[];
  transactions?: Transaction[];
  isDarkMode: boolean; // Retained for prop compatibility, but inside we enforce dark neon theme
  onUpdate?: (id: string, firstName: string, lastName: string) => Promise<void>;
  onRemove?: (id: string) => Promise<void>;
  onToggleStatus?: (id: string, currentStatus: boolean) => Promise<void>;
  loadingId: string | null;
  onAddClick?: () => void;
  onViewDetails?: (employeeId: string) => void;
}

export function EmployeeManagement({
  employees,
  transactions,
  isDarkMode,
  onUpdate,
  onRemove,
  onToggleStatus,
  loadingId,
  onAddClick,
  onViewDetails
}: EmployeeManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEmployeeForDetails, setSelectedEmployeeForDetails] = useState<Employee | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const startEdit = (emp: Employee) => {
    const isNameless = emp.name === emp.email || !emp.name;
    const parts = isNameless ? [] : emp.name.split(" ");
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

  const formatDate = (date: string | Date | number | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const sortedEmployees = [...employees.filter(e => e.role !== "boss")].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return 0;
  });

  return (
    <div className="space-y-6 w-full max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Ekip Üyeleri & Kasiyerler
          </h3>
          <p className="text-neutral-400 text-sm mt-1">
            Şubenizde aktif veya davet aşamasındaki personelleri yönetin.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {onAddClick && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-6 rounded-3xl border-2 border-dashed border-indigo-500/30 bg-[#0a0a0f]/40 flex flex-col items-center justify-center min-h-[280px] cursor-pointer transition-all hover:border-cyan-500/50 hover:bg-cyan-500/5 group text-center"
              onClick={onAddClick}
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-cyan-500/20 group-hover:border-cyan-500/30">
                <Plus size={32} className="text-indigo-400 group-hover:text-cyan-400 transition-colors" />
              </div>
              <span className="font-bold text-lg text-white group-hover:text-cyan-400 transition-colors">Yeni Kasiyer Ekle</span>
              <span className="text-sm text-neutral-500 mt-2">Ekibe yeni bir üye davet edin</span>
            </motion.div>
          )}

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
                className={`relative border transition-all overflow-hidden ${
                  isSuspended ? "opacity-60 bg-slate-900/30 border-slate-800" : "bg-[#0F172A] border-slate-800 hover:border-slate-600 shadow-sm"
                } p-4 rounded-xl`}
              >
                <div className="flex flex-col h-full gap-5">
                  {/* Header: Avatar & Info */}
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      {emp.avatar && emp.avatar.startsWith("http") ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={emp.avatar} 
                          alt={emp.name} 
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-slate-800/80 text-slate-300 border border-slate-700 shadow-inner text-base tracking-wider">
                          {getInitials(emp.name)}
                        </div>
                      )}
                      
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950" 
                        style={{ background: isPending ? "#6366f1" : isSuspended ? "#ef4444" : "#06b6d4" }} 
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingId === emp.id ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              value={firstName}
                              onChange={e => setFirstName(e.target.value)}
                              placeholder="Ad"
                              className="w-full px-2 py-1.5 rounded-lg text-sm bg-neutral-900 border border-neutral-700 text-white outline-none focus:border-cyan-500"
                            />
                            <input
                              value={lastName}
                              onChange={e => setLastName(e.target.value)}
                              placeholder="Soyad"
                              className="w-full px-2 py-1.5 rounded-lg text-sm bg-neutral-900 border border-neutral-700 text-white outline-none focus:border-cyan-500"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => saveEdit(emp.id)} 
                              className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              onClick={() => setEditingId(null)} 
                              className="p-1.5 rounded-lg bg-white/5 text-neutral-400 hover:bg-white/10 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-bold truncate ${emp.name === emp.email || !emp.name ? "text-amber-400 italic" : "text-white"}`}>
                              {emp.name === emp.email || !emp.name ? "İsimsiz Personel" : emp.name}
                            </h4>
                            {emp.role === "manager" && <ShieldCheck size={14} className="text-cyan-400 shrink-0" />}
                          </div>
                          <p className="text-neutral-400 text-[10px] truncate mt-0.5">{emp.email}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {emp.role === "manager" && (
                        <span className="text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/20">
                          Yönetici
                        </span>
                      )}

                      {isPending ? (
                        <span className="text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
                          <Mail size={12} /> Davet Bekliyor {emp.createdAt ? `(${new Date(emp.createdAt).toLocaleDateString("tr-TR")})` : ""}
                        </span>
                      ) : isActive ? (
                        <span className="text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/20">
                          Aktif
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/20">
                          Askıda
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {!isPending && onToggleStatus && (
                        <button 
                          onClick={() => onToggleStatus(emp.id, isActive)}
                          disabled={loadingId === emp.id}
                          className={`relative w-10 h-5 rounded-full transition-colors flex items-center ${
                            isActive ? "bg-cyan-500" : "bg-neutral-700"
                          } ${loadingId === emp.id ? "opacity-50 cursor-not-allowed" : ""}`}
                          aria-label="Aktiflik Durumu Değiştir"
                        >
                          <motion.div 
                            animate={{ x: isActive ? 22 : 2 }}
                            className="w-4 h-4 rounded-full bg-white shadow-sm"
                          />
                        </button>
                      )}

                      <div className="flex items-center gap-1 border-l border-white/10 pl-3">
                        {onUpdate && !isPending && (
                          <button 
                            onClick={() => startEdit(emp)} 
                            className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-neutral-400 hover:text-indigo-400 transition-all"
                            aria-label="Düzenle"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                        {onRemove && (
                          <button 
                            onClick={() => onRemove(emp.id)} 
                            disabled={loadingId === emp.id}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-all"
                            aria-label="Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats — Enhanced for accepted cashiers */}
                  {!isPending && (
                    <>
                      {/* Date info row */}
                      {(emp.createdAt || emp.acceptedAt) && (
                        <div className="flex flex-wrap items-center gap-3">
                          {emp.createdAt && (
                            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                              <Mail size={12} className="text-indigo-400/60" />
                              <span>Davet: <strong className="text-neutral-400">{formatDate(emp.createdAt)}</strong></span>
                            </div>
                          )}
                          {emp.acceptedAt && (
                            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                              <CalendarCheck size={12} className="text-cyan-400/60" />
                              <span>Onay: <strong className="text-neutral-400">{formatDate(emp.acceptedAt)}</strong></span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                        <div className="bg-neutral-900/60 rounded-xl p-3 border border-white/5 flex flex-col justify-center">
                          <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-1">Toplam İşlem</span>
                          <strong className="font-bold text-lg text-white leading-none">{emp.txCount || 0}</strong>
                        </div>
                        <div className="bg-neutral-900/60 rounded-xl p-3 border border-white/5 flex flex-col justify-center">
                          <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-1">Davet Ettiği Müşteri</span>
                          <div className="flex items-center gap-1.5">
                            <Users size={14} className="text-indigo-400" />
                            <strong className="font-bold text-lg text-indigo-300 leading-none">{emp.invitedCustomerCount || 0}</strong>
                          </div>
                        </div>
                        <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-800/50 flex flex-col justify-center">
                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Kazandırılan Puan</span>
                          <strong className="font-bold text-lg text-slate-200 leading-none">{emp.pointsEarned || 0} Puan</strong>
                        </div>
                        <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-800/50 flex flex-col justify-center">
                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Kullandırılan Puan</span>
                          <strong className="font-bold text-lg text-slate-200 leading-none">{emp.pointsSpent || 0} Puan</strong>
                        </div>
                      </div>

                      {/* "Detayları Gör" button */}
                      <button
                        onClick={() => {
                          if (onViewDetails) onViewDetails(emp.id);
                          setSelectedEmployeeForDetails(emp);
                        }}
                        className="w-full mt-2 py-2 rounded-lg text-sm font-medium text-slate-300 bg-slate-800/80 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2 group/detail"
                      >
                        <Eye size={15} className="text-slate-400 group-hover/detail:text-slate-200 transition-colors" />
                        Son İşlemleri Gör
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* İşlem Geçmişi Modalı */}
      <AnimatePresence>
        {selectedEmployeeForDetails && (
          <EmployeeDetailsModal
            employee={selectedEmployeeForDetails}
            transactions={transactions || []}
            onClose={() => setSelectedEmployeeForDetails(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmployeeDetailsModal({
  employee,
  transactions,
  onClose,
}: {
  employee: Employee;
  transactions: Transaction[];
  onClose: () => void;
}) {
  const myTxs = transactions.filter(tx => {
     // Currently we don't strictly have cashierId, so we match loosely
     return tx.cashier === "Kasiyer" || tx.cashier.includes(employee.name.split(" ")[0]); 
  }).slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#0F172A] border border-slate-700 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
             {employee.avatar && employee.avatar.startsWith("http") ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={employee.avatar} alt={employee.name} className="w-10 h-10 rounded-lg object-cover border border-slate-700" />
             ) : (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold bg-slate-800 text-slate-300 border border-slate-700 shadow-sm text-base tracking-wider">
                  {employee.name.trim().split(" ").map(n => n[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join("").toUpperCase()}
                </div>
             )}
             <div>
               <h3 className="text-lg font-semibold text-white">{employee.name}</h3>
               <p className="text-sm text-slate-400">{employee.email}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Son İşlemler ({myTxs.length})</h4>
          
          {myTxs.length > 0 ? (
            <div className="space-y-2">
              {myTxs.map((tx) => {
                 const isEarn = tx.type === "earned" || tx.type === "new";
                 const isSpend = tx.type === "spent";
                 
                 const colorClass = isEarn ? "text-emerald-500 bg-emerald-500/10" : isSpend ? "text-rose-500 bg-rose-500/10" : "text-slate-400 bg-slate-800";
                 const Icon = isEarn ? ArrowUpRight : isSpend ? ArrowDownLeft : Ban;
                 
                 return (
                   <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${colorClass}`}>
                         <Icon size={18} />
                       </div>
                       <div>
                         <p className="text-sm font-medium text-slate-200">
                           {isEarn ? "Puan Kazandırıldı" : isSpend ? "Puan Harcatıldı" : "İşlem İptali"}
                         </p>
                         <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                           <span className="flex items-center gap-1"><Clock size={12} /> {tx.time}</span>
                           <span>•</span>
                           <span className="truncate max-w-[100px]" title={tx.customer}>{tx.customer}</span>
                         </div>
                       </div>
                     </div>
                     <div className="text-right shrink-0 ml-2">
                       <strong className={`block text-base font-semibold ${isEarn ? "text-emerald-400" : isSpend ? "text-rose-400" : "text-slate-400"}`}>
                         {isEarn ? "+" : isSpend ? "-" : ""}{(tx.pts / 100).toFixed(2)}
                       </strong>
                       <span className="text-[10px] uppercase font-medium text-slate-500">Puan</span>
                     </div>
                   </div>
                 )
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-sm">Bu personele ait henüz bir işlem bulunmuyor.</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
