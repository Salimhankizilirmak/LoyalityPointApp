"use client";
 
 
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, UserPlus, Mail, Briefcase, Edit3, Check, X } from "lucide-react";
import { Employee } from "../types";
 
interface StaffManagementProps {
  employees: Employee[];
  isDarkMode: boolean;
  onUpdate?: (id: string, firstName: string, lastName: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onReassign: (emp: Employee) => void;
  onInvite: () => void;
  loadingId: string | null;
  hasNoUsername?: boolean;
}
 
export function StaffManagement({
  employees,
  isDarkMode,
  onUpdate,
  onRemove,
  onReassign,
  onInvite,
  loadingId,
  hasNoUsername
}: StaffManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Ekip Yönetimi</h2>
          <p className="text-slate-500 text-sm mt-1">Sistemdeki yöneticileri yönetin.</p>
        </div>
        <div className="relative group/tooltip">
          <button
            onClick={() => {
              if (hasNoUsername) return;
              onInvite();
            }}
            disabled={hasNoUsername}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all ${
              hasNoUsername
                ? "opacity-40 cursor-not-allowed bg-slate-800 border border-white/10 text-slate-500 hover:scale-100 shadow-none"
                : "bg-blue-600 text-white shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            <UserPlus size={18} /> Yeni Ekip Üyesi Davet Et
          </button>
          {hasNoUsername && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50">
              Bu işlemi gerçekleştirmek için kullanıcı adı belirlemelisiniz.
            </div>
          )}
        </div>
      </div>
 
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {employees.filter(e => e.role !== "boss").map((emp, i) => (
            <motion.div
              key={emp.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.03 }}
              className={`p-5 rounded-3xl border transition-all ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:border-slate-600" : "bg-white border-slate-100 hover:border-blue-200 shadow-sm"
                }`}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold ${isDarkMode ? "bg-slate-700 text-blue-400" : "bg-blue-50 text-blue-600"
                      }`}>
                      {emp.avatar || emp.name[0]}
                    </div>
                    <div>
                      <div className="flex flex-col w-full">
                        {editingId === emp.id ? (
                          <div className="space-y-2 w-full mt-1">
                            <div className="flex gap-2">
                              <input
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                placeholder="Ad"
                                className={`w-full px-2 py-1.5 rounded-lg text-sm border outline-none ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                              />
                              <input
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                placeholder="Soyad"
                                className={`w-full px-2 py-1.5 rounded-lg text-sm border outline-none ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => saveEdit(emp.id)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                                <Check size={14} />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-slate-500/10 text-slate-500 hover:bg-slate-500/20">
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-bold truncate ${emp.name === emp.email || !emp.name ? "text-amber-500 italic" : (isDarkMode ? "text-white" : "text-slate-800")}`}>
                                {emp.name === emp.email || !emp.name ? "İsimsiz Personel" : emp.name}
                              </p>
                              {onUpdate && (
                                <button onClick={() => startEdit(emp)} className={`p-1 rounded-md transition-colors ${isDarkMode ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-800"}`}>
                                  <Edit3 size={12} />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${emp.role === "manager" ? "bg-blue-500/10 text-blue-500" : "bg-slate-500/10 text-slate-500"
                                }`}>
                                {emp.role === "manager" ? "Yönetici" : "Kasiyer"}
                              </span>
                              {emp.status === "pending" && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-black uppercase tracking-wider">Bekliyor</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
 
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRemove(emp.id)}
                      disabled={loadingId === emp.id}
                      className={`p-2 rounded-xl transition-all ${isDarkMode ? "hover:bg-rose-500/10 text-slate-500" : "hover:bg-rose-50 text-slate-400"} hover:text-rose-500`}
                      title="Çalışanı Sil"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
 
                <div className="space-y-2 mt-auto">
                  <div className={`flex items-center gap-2 p-2 rounded-xl border ${isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-slate-50 border-slate-100"}`}>
                    <Mail size={12} className="text-slate-400" />
                    <p className={`text-[11px] font-medium truncate ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>{emp.email}</p>
                  </div>
                  <div className={`flex items-center justify-between p-2 rounded-xl border ${isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-slate-50 border-slate-100"}`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Briefcase size={12} className="text-slate-400 shrink-0" />
                      <p className={`text-[11px] font-medium truncate ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                        {emp.branch || (emp.role === "manager" ? "Şube Yönetimi" : "Genel")}
                      </p>
                    </div>
                    {emp.role === "manager" && (
                      <button
                        onClick={() => onReassign(emp)}
                        className={`text-[9px] font-bold px-2 py-1 rounded-lg transition-all ${isDarkMode ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          }`}
                      >
                        Şube Değiştir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
