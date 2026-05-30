"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, Award, Edit3, Trash2, UserPlus } from "lucide-react";
import { Customer, Transaction } from "../types";

interface CustomerManagementProps {
  customers: Customer[];
  transactions?: Transaction[];
  isDarkMode: boolean;
  onUpdate?: (id: string, data: Partial<Customer>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onAddClick?: () => void;
  loadingId?: string | null;
  hideAddButton?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function CustomerManagement({
  customers,
  transactions = [],
  isDarkMode,
  onUpdate,
  onDelete,
  onAddClick,
  loadingId,
  hideAddButton = false,
  searchQuery,
  onSearchChange
}: CustomerManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [localSearchQuery, setLocalSearchQuery] = useState("");

  const activeSearch = searchQuery !== undefined ? searchQuery : localSearchQuery;
  const handleSearchChange = onSearchChange !== undefined ? onSearchChange : setLocalSearchQuery;

  const startEdit = (cust: Customer) => {
    setFormData(cust);
    setEditingId(cust.id);
  };

  const saveEdit = async (id: string) => {
    if (onUpdate) {
      await onUpdate(id, formData);
    }
    setEditingId(null);
  };

  // Safe client-side filtering
  const filteredCustomers = customers.filter(c => {
    if (!activeSearch) return true;
    const query = activeSearch.toLowerCase();
    const first = (c.firstName || "").toLowerCase();
    const last = (c.lastName || "").toLowerCase();
    const phoneNum = c.phone || "";
    return first.includes(query) || last.includes(query) || phoneNum.includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            {onUpdate ? "Müşteri Portföyü" : "Şube Müşteri Denetim Havuzu"}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {onUpdate
              ? "Sistemdeki müşterileri yönetin."
              : "Şubede işlem yapmış veya organizasyona kayıtlı tüm müşterilerin işlem geçmişleri."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!hideAddButton && onAddClick && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[44px]"
            >
              <UserPlus size={16} /> Yeni Müşteri
            </button>
          )}
          <div className="relative">
            <label htmlFor="customerSearch" className="sr-only">Müşteri Ara</label>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="customerSearch"
              value={activeSearch}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Müşteri adı"
              className={`pl-10 pr-4 py-2 rounded-xl text-sm border outline-none w-full sm:w-64 min-h-[44px] ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"
                }`}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredCustomers.map((cust, i) => {
            const customerName = `${cust.firstName} ${cust.lastName}`.trim().toLowerCase();

            // Bu müşterinin bu şubedeki işlemlerini bulalım (varsa)
            const customerTxs = transactions.filter(
              tx => tx.customer.toLowerCase() === customerName
            );

            // Son işlem
            const lastTx = customerTxs.length > 0 ? customerTxs[0] : null;

            // Bu şubedeki toplam puan hareketi
            const totalBranchPoints = customerTxs.reduce((sum, tx) => {
              return sum + tx.pts;
            }, 0);

            return (
              <motion.div
                key={cust.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
                className={`p-4 rounded-2xl border transition-all ${isDarkMode
                  ? "bg-slate-900/40 border-slate-800 text-white hover:border-indigo-500/20"
                  : "bg-white border-slate-100 shadow-sm hover:shadow-md"
                  }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Sol Bölüm: Müşteri Künyesi */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xs font-bold flex-shrink-0 bg-gradient-to-tr ${isDarkMode
                      ? "from-cyan-900/50 to-indigo-900/50 text-cyan-300 border border-cyan-500/20"
                      : "from-cyan-50 to-indigo-50 text-cyan-600 border border-cyan-100"
                      }`}>
                      {cust.firstName?.[0] || ""}{cust.lastName?.[0] || ""}
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
                      <div>
                        <p className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                          {cust.firstName} {cust.lastName}
                        </p>
                        <p className="text-slate-500 text-xs font-mono">{cust.phone}</p>
                      </div>
                    )}
                  </div>

                  {/* Orta Bölüm: Şube Denetim Logları (Yalnızca Manager/Audit modunda gösterilir) */}
                  {!onUpdate && (
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      {lastTx ? (
                        <>
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${isDarkMode ? "bg-slate-800/30 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-600"
                            }`}>
                            <Calendar size={13} className="text-cyan-500" />
                            <span>Son İşlem: <strong className="font-semibold">{lastTx.time}</strong></span>
                          </div>

                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${isDarkMode ? "bg-slate-800/30 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-600"
                            }`}>
                            <Award size={13} className="text-indigo-500" />
                            <span>Şube Puan Katkısı: <strong className={`font-semibold ${totalBranchPoints >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                              {totalBranchPoints >= 0 ? "+" : ""}{(totalBranchPoints / 100).toFixed(2)} p
                            </strong></span>
                          </div>
                        </>
                      ) : (
                        <div className={`px-3 py-1.5 rounded-xl text-[11px] font-medium border ${isDarkMode ? "bg-slate-950/20 border-slate-900 text-slate-500" : "bg-slate-50 border-slate-100 text-slate-400"
                          }`}>
                          Bu şubede işlem kaydı yok
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sağ Bölüm: Global Puan Durumu ve Eylemler */}
                  <div className="flex items-center gap-4 justify-end flex-shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Genel Puan Bakiye</span>
                      <strong className="text-cyan-500 font-extrabold text-sm font-mono">
                        {(cust.currentPoints / 100).toFixed(2)} p
                      </strong>
                    </div>

                    {/* Edit/Delete Eylemleri (Sadece Boss modunda - onUpdate mevcutken) */}
                    {onUpdate && onDelete && editingId !== cust.id && (
                      <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                        <button
                          onClick={() => startEdit(cust)}
                          className="p-2 rounded-xl text-slate-400 hover:text-blue-500 transition-colors min-h-[44px]"
                          aria-label="Düzenle"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => onDelete(cust.id)}
                          disabled={loadingId === cust.id}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 transition-colors min-h-[44px]"
                          aria-label="Sil"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filteredCustomers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500 text-xs">Müşteri bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}
