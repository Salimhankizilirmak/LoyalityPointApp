"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit3, Trash2, Check, X, UserPlus, ShieldCheck, Mail, Briefcase } from "lucide-react";
import { Employee } from "./types";

interface StaffManagementProps {
  employees: Employee[];
  isDarkMode: boolean;
  onUpdate: (id: string, firstName: string, lastName: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onInvite: () => void;
  loadingId: string | null;
}

export function StaffManagement({
  employees,
  isDarkMode,
  onUpdate,
  onRemove,
  onInvite,
  loadingId
}: StaffManagementProps) {
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
    await onUpdate(id, firstName, lastName);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Ekip Yönetimi</h2>
          <p className="text-slate-500 text-sm mt-1">Sistemdeki yönetici ve kasiyerleri düzenleyin.</p>
        </div>
        <button 
          onClick={onInvite}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <UserPlus size={18} /> Yeni Ekip Üyesi Davet Et
        </button>
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
              className={`p-5 rounded-3xl border transition-all ${
                isDarkMode ? "bg-slate-800/50 border-slate-700 hover:border-slate-600" : "bg-white border-slate-100 hover:border-blue-200 shadow-sm"
              }`}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold ${
                      isDarkMode ? "bg-slate-700 text-blue-400" : "bg-blue-50 text-blue-600"
                    }`}>
                      {emp.avatar || emp.name[0]}
                    </div>
                    <div>
                      {editingId === emp.id ? (
                        <div className="space-y-2">
                          <input 
                            value={firstName} onChange={e => setFirstName(e.target.value)}
                            placeholder="Ad"
                            className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-none ${
                              isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                            }`}
                          />
                          <input 
                            value={lastName} onChange={e => setLastName(e.target.value)}
                            placeholder="Soyad"
                            className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-none ${
                              isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                            }`}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <p className={`text-sm font-bold truncate ${isDarkMode ? "text-white" : "text-slate-800"}`}>{emp.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                              emp.role === "manager" ? "bg-blue-500/10 text-blue-500" : "bg-slate-500/10 text-slate-500"
                            }`}>
                              {emp.role === "manager" ? "Yönetici" : "Kasiyer"}
                            </span>
                            {emp.status === "pending" && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-black uppercase tracking-wider">Bekliyor</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {editingId === emp.id ? (
                      <>
                        <button onClick={() => saveEdit(emp.id)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"><Check size={14}/></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-slate-500/10 text-slate-500 hover:bg-slate-500 hover:text-white transition-all"><X size={14}/></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(emp)} className={`p-2 rounded-xl transition-all ${isDarkMode ? "hover:bg-blue-500/10 text-slate-500" : "hover:bg-blue-50 text-slate-400"} hover:text-blue-500`}>
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => onRemove(emp.id)} disabled={loadingId === emp.id} className={`p-2 rounded-xl transition-all ${isDarkMode ? "hover:bg-rose-500/10 text-slate-500" : "hover:bg-rose-50 text-slate-400"} hover:text-rose-500`}>
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mt-auto">
                  <div className={`flex items-center gap-2 p-2 rounded-xl border ${isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-slate-50 border-slate-100"}`}>
                    <Mail size={12} className="text-slate-400" />
                    <p className={`text-[11px] font-medium truncate ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>{emp.email}</p>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded-xl border ${isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-slate-50 border-slate-100"}`}>
                    <Briefcase size={12} className="text-slate-400" />
                    <p className={`text-[11px] font-medium truncate ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      {emp.role === "manager" ? "Şube Yönetimi" : "Satış ve İşlem"}
                    </p>
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
