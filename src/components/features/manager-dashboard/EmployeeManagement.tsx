"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit3, Trash2, Check, X, UserPlus, ShieldCheck } from "lucide-react";
import { Employee } from "./types";

interface EmployeeManagementProps {
  employees: Employee[];
  isDarkMode: boolean;
  onUpdate: (id: string, firstName: string, lastName: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onAddClick?: () => void;
  loadingId: string | null;
}

export function EmployeeManagement({
  employees,
  isDarkMode,
  onUpdate,
  onRemove,
  onAddClick,
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
    await onUpdate(id, firstName, lastName);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Çalışan Yönetimi</h2>
          <p className="text-slate-500 text-sm mt-1">Kasiyer ve yönetici bilgilerini düzenleyin veya silin.</p>
        </div>
        <button 
          onClick={onAddClick}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <UserPlus size={16} /> Yeni Çalışan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {employees.filter(e => e.role !== "boss").map((emp, i) => (
            <motion.div
              key={emp.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-2xl border transition-all ${
                isDarkMode ? "bg-slate-800/50 border-slate-700 hover:border-slate-600" : "bg-white border-slate-100 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold ${
                    isDarkMode ? "bg-slate-700 text-blue-400" : "bg-blue-50 text-blue-600"
                  }`}>
                    {emp.avatar || emp.name[0]}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${
                    isDarkMode ? "border-slate-800" : "border-white"
                  }`} style={{ background: emp.status === "active" ? "#22c55e" : "#94a3b8" }} />
                </div>

                {editingId === emp.id ? (
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input 
                        value={firstName} 
                        onChange={e => setFirstName(e.target.value)}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs border outline-none ${
                          isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                        }`}
                      />
                      <input 
                        value={lastName} 
                        onChange={e => setLastName(e.target.value)}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs border outline-none ${
                          isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                        }`}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => saveEdit(emp.id)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500"><Check size={14}/></button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-slate-500/10 text-slate-500"><X size={14}/></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>{emp.name}</p>
                        {emp.role === "manager" && <ShieldCheck size={12} className="text-blue-500" />}
                      </div>
                      <p className="text-slate-500 text-xs">{emp.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          emp.role === "manager" ? "bg-blue-500/10 text-blue-500" : "bg-slate-500/10 text-slate-500"
                        }`}>
                          {emp.role === "manager" ? "Yönetici" : "Kasiyer"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(emp)} className="p-2 rounded-xl text-slate-400 hover:text-blue-500 transition-colors"><Edit3 size={16} /></button>
                      <button onClick={() => onRemove(emp.id)} disabled={loadingId === emp.id} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
