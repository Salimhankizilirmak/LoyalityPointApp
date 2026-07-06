"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  UserPlus,
  Mail,
  UserX,
  Check,
  X,
  Eye,
  Edit3,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Ban,
  Clock
} from "lucide-react";
import { Customer, Transaction } from "../types";

interface CustomerManagementProps {
  customers: Customer[];
  transactions?: Transaction[];
  isDarkMode: boolean;
  onUpdate?: (id: string, data: Partial<Customer>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onAddClick?: () => void;
  onViewDetails?: (id: string) => void;
  loadingId?: string | null;
  hideAddButton?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function CustomerManagement({
  customers,
  transactions = [],
  isDarkMode: _isDarkMode,
  onUpdate,
  onDelete,
  onAddClick,
  onViewDetails,
  loadingId,
  hideAddButton = false,
  searchQuery,
  onSearchChange,
}: CustomerManagementProps) {
  void _isDarkMode;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);

  const activeSearch =
    searchQuery !== undefined ? searchQuery : localSearchQuery;
  const handleSearchChange =
    onSearchChange !== undefined ? onSearchChange : setLocalSearchQuery;

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

  // Safe client-side filtering and sorting
  const filteredCustomers = customers
    .filter((c) => {
      if (!activeSearch) return true;
      const query = activeSearch.toLowerCase();
      const first = (c.firstName || "").toLowerCase();
      const last = (c.lastName || "").toLowerCase();
      const phoneNum = c.phone || "";
      const emailMatch = (c.email || "").toLowerCase();
      return (
        first.includes(query) || 
        last.includes(query) || 
        phoneNum.includes(query) ||
        emailMatch.includes(query)
      );
    })
    .sort((a, b) => {
      const aName = `${a.firstName} ${a.lastName}`.trim().toLowerCase();
      const bName = `${b.firstName} ${b.lastName}`.trim().toLowerCase();
      const aTxs = transactions.filter(
        (tx) => tx.customer.toLowerCase() === aName
      );
      const bTxs = transactions.filter(
        (tx) => tx.customer.toLowerCase() === bName
      );

      if (aTxs.length === 0 && bTxs.length === 0) return 0;
      if (aTxs.length === 0) return 1;
      if (bTxs.length === 0) return -1;

      const aIdx = transactions.indexOf(aTxs[0]);
      const bIdx = transactions.indexOf(bTxs[0]);
      return aIdx - bIdx;
    });

  const visibleCustomers = activeSearch
    ? filteredCustomers
    : filteredCustomers.slice(0, 4);

  return (
    <div className="relative space-y-6 w-full max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {onUpdate ? "Müşteri Portföyü" : "Müşteriler"}
          </h3>
          <p className="text-neutral-400 text-sm mt-1">
            {onUpdate
              ? "Sistemdeki müşterileri yönetin."
              : "Şubenizde son işlem yapan müşteriler ve tüm müşteri veritabanı."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!hideAddButton && onAddClick && (
            <button
              onClick={onAddClick}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus size={16} /> Yeni Müşteri
            </button>
          )}

          <div className="relative">
            <label htmlFor="customerSearch" className="sr-only">
              Müşteri Ara
            </label>
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              id="customerSearch"
              value={activeSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Telefon, isim veya mail ara..."
              aria-label="Müşteri arama"
              className="min-h-[44px] w-full rounded-xl border border-neutral-700 bg-neutral-900/60 py-2 pl-10 pr-4 text-sm text-white outline-none backdrop-blur-sm transition-colors placeholder:text-neutral-500 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {visibleCustomers.length > 0 ? (
            visibleCustomers.map((cust, i) => {
              const customerName = `${cust.firstName} ${cust.lastName}`
                .trim()
                .toLowerCase();

              const customerTxs = transactions.filter(
                (tx) => tx.customer.toLowerCase() === customerName
              );
              const lastTx = customerTxs.length > 0 ? customerTxs[0] : null;

              const isEditing = editingId === cust.id;
              const isPending = cust.status === "pending";
              
              // Kullanıcı adı gösterimi: DB'den username phone alanına mapped olarak geliyor
              const displayUsername = cust.phone || (cust.email ? cust.email.split('@')[0] : "İsimsiz");

              return (
                <motion.div
                  key={cust.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative border border-white/5 transition-all overflow-hidden bg-slate-950/50 hover:border-indigo-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] backdrop-blur-xl p-4 rounded-2xl flex flex-col gap-4"
                >
                  <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] -z-10 ${isPending ? "bg-amber-500/10" : "bg-cyan-500/10"}`} />

                  {/* Header: Avatar & Info */}
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/20 shadow-inner text-base">
                        {cust.firstName?.[0] || ""}{cust.lastName?.[0] || ""}
                      </div>
                      {isPending && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950 bg-amber-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              value={formData.firstName || ""}
                              onChange={(e) =>
                                setFormData({ ...formData, firstName: e.target.value })
                              }
                              placeholder="Ad"
                              className="w-full px-2 py-1.5 rounded-lg text-sm bg-neutral-900 border border-neutral-700 text-white outline-none focus:border-cyan-500"
                            />
                            <input
                              value={formData.lastName || ""}
                              onChange={(e) =>
                                setFormData({ ...formData, lastName: e.target.value })
                              }
                              placeholder="Soyad"
                              className="w-full px-2 py-1.5 rounded-lg text-sm bg-neutral-900 border border-neutral-700 text-white outline-none focus:border-cyan-500"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => saveEdit(cust.id)}
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
                            <h4 className="text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">{cust.firstName} {cust.lastName}</h4>
                          </div>
                          <p className="text-neutral-400 text-[11px] font-mono truncate mt-0.5">
                            @{displayUsername}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions Row */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    {isPending ? (
                      <div className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/20">
                        <Mail size={12} /> Davet Bekliyor
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                        Aktif
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      {onUpdate && !isEditing && (
                        <button
                          onClick={() => startEdit(cust)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                          title="Düzenle"
                        >
                          <Edit3 size={15} />
                        </button>
                      )}
                      {onDelete && !isEditing && (
                        <button
                          onClick={() => onDelete(cust.id)}
                          disabled={loadingId === cust.id}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                          title="Sil"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  {!isEditing && (
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 rounded-xl p-3 border border-cyan-500/20 flex flex-col justify-center">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                          <Check size={32} />
                        </div>
                        <span className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-widest mb-1 z-10">Mevcut Puan</span>
                        <strong className="font-bold text-xl text-cyan-300 leading-none z-10 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                          {(cust.currentPoints / 100).toFixed(2)} <span className="text-xs text-cyan-500">p</span>
                        </strong>
                      </div>
                      
                      {lastTx ? (
                        <div className="bg-neutral-900/60 rounded-xl p-3 border border-white/5 flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Son İşlem</span>
                          <strong className="font-bold text-sm text-neutral-300 leading-none truncate" title={lastTx.time}>{lastTx.time}</strong>
                        </div>
                      ) : (
                        <div className="bg-neutral-900/60 rounded-xl p-3 border border-white/5 flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Son İşlem</span>
                          <strong className="font-bold text-xs text-neutral-500 leading-none">İşlem Yok</strong>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-1">
                    <button
                      onClick={() => {
                        if (onViewDetails) onViewDetails(cust.id);
                        setSelectedCustomerForDetails(cust);
                      }}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border border-white/10 hover:from-indigo-500/30 hover:to-cyan-500/30 hover:border-cyan-500/40 transition-all flex items-center justify-center gap-2 group/detail shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                    >
                      <Eye size={16} className="text-indigo-400 group-hover/detail:text-cyan-400 transition-colors" />
                      Detayları Gör
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="col-span-1 md:col-span-3 xl:col-span-4 flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-[#0a0a0f]/40 px-6 py-16 text-center backdrop-blur-xl"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/10 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10">
                <UserX size={28} className="text-neutral-500" />
              </div>
              <p className="text-sm font-semibold text-neutral-300">
                Müşteri bulunamadı
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Arama kriterlerinize uygun müşteri bulunmamaktadır.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detay Modalı */}
      <AnimatePresence>
        {selectedCustomerForDetails && (
          <CustomerDetailsModal
            customer={selectedCustomerForDetails}
            transactions={transactions.filter(
              (tx) => tx.customer.toLowerCase() === `${selectedCustomerForDetails.firstName} ${selectedCustomerForDetails.lastName}`.trim().toLowerCase()
            )}
            onClose={() => setSelectedCustomerForDetails(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomerDetailsModal({
  customer,
  transactions,
  onClose,
}: {
  customer: Customer;
  transactions: Transaction[];
  onClose: () => void;
}) {
  // Son 10 işlemi al
  const recentTxs = transactions.slice(0, 10);
  const displayUsername = customer.phone || (customer.email ? customer.email.split('@')[0] : "İsimsiz");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-lg">
                {customer.firstName?.[0] || ""}{customer.lastName?.[0] || ""}
             </div>
             <div>
               <h3 className="text-xl font-bold text-white">{customer.firstName} {customer.lastName}</h3>
               <p className="text-sm text-cyan-400 font-mono mt-0.5">@{displayUsername}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Son İşlemler ({recentTxs.length})</h4>
          
          {recentTxs.length > 0 ? (
            <div className="space-y-3">
              {recentTxs.map((tx) => {
                 const isEarn = tx.type === "earned" || tx.type === "new";
                 const isSpend = tx.type === "spent";
                 const isVoid = tx.type === "void";
                 
                 const colorClass = isEarn ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : isSpend ? "text-rose-400 bg-rose-500/10 border-rose-500/20" : "text-neutral-400 bg-neutral-500/10 border-neutral-500/20";
                 const Icon = isEarn ? ArrowUpRight : isSpend ? ArrowDownLeft : Ban;
                 
                 return (
                   <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                     <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border ${colorClass}`}>
                         <Icon size={18} />
                       </div>
                       <div>
                         <p className="text-sm font-bold text-white">
                           {isEarn ? "Puan Kazanımı" : isSpend ? "Puan Harcaması" : "İşlem İptali"}
                         </p>
                         <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                           <span className="flex items-center gap-1"><Clock size={12} /> {tx.time}</span>
                           <span>•</span>
                           <span className="truncate max-w-[100px]" title={tx.cashier}>{tx.cashier}</span>
                         </div>
                       </div>
                     </div>
                     <div className="text-right shrink-0 ml-2">
                       <strong className={`block text-lg font-bold ${isEarn ? "text-emerald-400" : isSpend ? "text-rose-400" : "text-neutral-500"}`}>
                         {isEarn ? "+" : isSpend ? "-" : ""}{(tx.pts / 100).toFixed(2)}
                       </strong>
                       <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Puan</span>
                     </div>
                   </div>
                 )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500 text-sm">Bu müşteriye ait henüz bir işlem bulunmuyor.</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
