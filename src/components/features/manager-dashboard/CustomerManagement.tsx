"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit3, Trash2, Search, UserPlus } from "lucide-react";
import { Customer } from "./types";
import { AddCustomerModal } from "./AddCustomerModal";

interface CustomerManagementProps {
  customers: Customer[];
  isDarkMode: boolean;
  onUpdate: (id: string, data: Partial<Customer>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: (data: { firstName: string; lastName: string; phone: string }) => Promise<void>;
  loadingId: string | null;
}

export function CustomerManagement({
  customers,
  isDarkMode,
  onUpdate,
  onDelete,
  onAdd,
  loadingId
}: CustomerManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const startEdit = (cust: Customer) => {
    setFormData(cust);
    setEditingId(cust.id);
  };

  const saveEdit = async (id: string) => {
    await onUpdate(id, formData);
    setEditingId(null);
  };

  const filtered = customers.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showAdd && (
          <AddCustomerModal 
            onClose={() => setShowAdd(false)} 
            onAdd={onAdd}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Müşteri Portföyü</h2>
          <p className="text-slate-500 text-sm mt-1">Sistemdeki müşterileri yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[44px]"
          >
            <UserPlus size={16} /> Yeni Müşteri
          </button>
          <div className="relative">
            <label htmlFor="customerSearch" className="sr-only">Müşteri Ara</label>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              id="customerSearch"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Müşteri ara..."
              className={`pl-10 pr-4 py-2 rounded-xl text-sm border outline-none w-full sm:w-64 min-h-[44px] ${
                isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"
              }`}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((cust, i) => (
            <motion.div
              key={cust.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03 }}
              className={`p-4 rounded-2xl border transition-all ${
                isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold ${
                  isDarkMode ? "bg-slate-700 text-cyan-400" : "bg-cyan-50 text-cyan-600"
                }`}>
                  {cust.firstName[0]}{cust.lastName[0]}
                </div>

                {editingId === cust.id ? (
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input 
                      value={formData.firstName || ""} 
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      className={`px-3 py-1.5 rounded-lg text-xs border outline-none ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                    <input 
                      value={formData.lastName || ""} 
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      className={`px-3 py-1.5 rounded-lg text-xs border outline-none ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                    <div className="flex justify-end gap-2 col-span-full">
                      <button onClick={() => saveEdit(cust.id)} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold min-h-[44px]">Kaydet</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold min-h-[44px]">İptal</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>{cust.firstName} {cust.lastName}</p>
                      <p className="text-slate-500 text-xs">{cust.phone}</p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="text-blue-500 font-bold text-sm">{cust.currentPoints} p</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(cust)} className="p-2 rounded-xl text-slate-400 hover:text-blue-500 transition-colors min-h-[44px]" aria-label="Düzenle"><Edit3 size={16}/></button>
                      <button onClick={() => onDelete(cust.id)} disabled={loadingId === cust.id} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 transition-colors min-h-[44px]" aria-label="Sil"><Trash2 size={16}/></button>
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
