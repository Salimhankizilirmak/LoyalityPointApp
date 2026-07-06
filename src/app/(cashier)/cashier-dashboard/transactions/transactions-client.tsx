"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  ArrowLeft, Search, Calendar,
  Filter, ChevronDown, RefreshCw, AlertTriangle,
  ArrowUpDown, User, Mail, Phone, Info, X, Clock, CheckCircle2, XCircle, MoreVertical
} from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { getFilteredTransactionsAction, voidTransactionAction } from "../actions";
import { CashierDashboardModals } from "@/components/features/cashier-dashboard/modals/CashierDashboardModals";


interface CashierInfo {
  name: string;
  email: string;
  branchName: string;
}

export interface Transaction {
  id: string;
  organizationId: string;
  branchId: string;
  customerId: string;
  cashierId: string;
  type: "EARN" | "BURN" | "VOID";
  amountSpent: number | null;
  pointsAmount: number;
  status: "SUCCESS" | "VOIDED";
  parentTransactionId?: string | null;
  createdAtFormatted: string;
  createdAt?: Date | number;
  customerName: string;
  customerPhone: string;
  cashierName: string;
  cashierEmail?: string;
}

interface TransactionsClientPageProps {
  cashierInfo: CashierInfo;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export function TransactionsClientPage({ cashierInfo }: TransactionsClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerIdParam = searchParams?.get("customerId") || "";

  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();

  // Theme and UI States
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSignOutOverlay, setShowSignOutOverlay] = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);

  // Customer Detail Overlay State
  const [selectedCustomer, setSelectedCustomer] = useState<{
    name: string;
    phone: string;
    email: string;
    txs: Transaction[];
  } | null>(null);

  // Filter & Query States
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState<"EARN" | "BURN" | "VOID" | "ALL">("ALL");
  const [status, setStatus] = useState<"SUCCESS" | "VOIDED" | "ALL">("ALL");

  // Sorting & Pagination States
  const [sortBy, setBy] = useState<"createdAt" | "pointsAmount" | "amountSpent" | "customerName">("createdAt");
  const [sortOrder, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Data States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const startMs = !customerIdParam && startDate ? new Date(startDate).setHours(0, 0, 0, 0) : undefined;
    const endMs = !customerIdParam && endDate ? new Date(endDate).setHours(23, 59, 59, 999) : undefined;

    try {
      const res = await getFilteredTransactionsAction({
        query: customerIdParam ? undefined : (query.trim() || undefined),
        startDate: startMs,
        endDate: endMs,
        type: customerIdParam ? "ALL" : type,
        status: customerIdParam ? "ALL" : status,
        limit,
        page,
        sortBy,
        sortOrder,
        customerId: customerIdParam || undefined
      });

      if (res.success && res.transactions) {
        setTransactions(res.transactions as Transaction[]);
        setTotalCount(res.totalCount || 0);
      } else {
        setError(res.error || "İşlemler yüklenirken hata oluştu.");
      }
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  }, [query, startDate, endDate, type, status, page, sortBy, sortOrder, limit, customerIdParam]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Handle transaction Void/Reversal
  const handleVoid = async (txId: string) => {
    if (!window.confirm("Bu işlemi iptal etmek (Void) istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
      return;
    }
    setVoidingId(txId);
    setError("");

    try {
      const res = await voidTransactionAction(txId);
      if (res.success) {
        await loadData();
      } else {
        setError(res.error || "İptal işlemi gerçekleştirilemedi.");
      }
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setVoidingId(null);
    }
  };

  const toggleSort = (field: "createdAt" | "pointsAmount" | "amountSpent" | "customerName") => {
    if (sortBy === field) {
      setOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setBy(field);
      setOrder("desc");
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setQuery("");
    setStartDate("");
    setEndDate("");
    setType("ALL");
    setStatus("ALL");
    setPage(1);
  };

  const handleOpenCustomerCard = (customerName: string, customerPhone: string, customerId: string) => {
    // Collect transactions belonging to this customer within current list
    const customerTxs = transactions.filter(t => t.customerId === customerId);
    setSelectedCustomer({
      name: customerName,
      phone: customerPhone,
      email: customerTxs[0]?.cashierEmail || "Belirtilmemiş",
      txs: customerTxs,
    });
  };

  const formatCurrency = (amountInKurus: number | null) => {
    if (amountInKurus === null || amountInKurus === 0) return "—";
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amountInKurus / 100);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className={`min-h-screen flex flex-col font-sans select-none antialiased transition-colors duration-300 ${isDarkMode ? "bg-neutral-950 text-slate-100" : "bg-slate-50 text-slate-800"
      }`}>
      {/* Oturum Kapama Modalı */}
      <CashierDashboardModals
        branchStatus={null}
        showAddCustomer={false}
        setShowAddCustomer={() => { }}
        handleAddCustomer={async () => { }}
      />

      {/* Ortak Navigasyon Header */}


      {/* 📊 Ana Bölüm Grid */}
      <main className="flex-1 w-full mx-auto px-4 py-8 space-y-6 max-w-7xl">

        {/* 🔍 Gelişmiş Filtreleme Paneli */}
        <GlassPanel className="p-6 md:p-8 bg-neutral-900/60 border-indigo-500/15 shadow-xl relative overflow-visible" elevated>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <Filter size={18} />
              </div>
              <h2 className="text-base font-bold text-slate-200 tracking-wide uppercase">İşlem Filtreleme</h2>
            </div>
            
            {/* Sort Toggle Group */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1 overflow-x-auto">
              {[
                { id: "createdAt", label: "Tarih" },
                { id: "pointsAmount", label: "Puan" },
                { id: "amountSpent", label: "Harcama" }
              ].map((sortOption) => (
                <button
                  key={sortOption.id}
                  onClick={() => toggleSort(sortOption.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    sortBy === sortOption.id 
                      ? "bg-indigo-500/20 text-indigo-300 shadow-sm" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  {sortOption.label}
                  {sortBy === sortOption.id && (
                    <ArrowUpDown size={10} className={sortOrder === "asc" ? "rotate-180 transition-transform" : "transition-transform"} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Quick Text Query */}
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Müşteri Bilgileri</label>
              <div className="relative group">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                  placeholder="İsim, telefon, e-posta..."
                  className={`w-full pl-11 pr-4 py-3 text-sm rounded-xl outline-none transition-all duration-300 ${isDarkMode
                      ? "bg-black/20 border border-white/10 text-white focus:border-indigo-500 focus:bg-black/40 group-hover:border-white/20"
                      : "bg-white border border-slate-200 text-slate-900 focus:border-indigo-500"
                    }`}
                />
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-indigo-400 transition-colors duration-300" />
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Başlangıç</label>
              <div className="relative group">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className={`w-full pl-11 pr-4 py-3 text-sm rounded-xl outline-none transition-all duration-300 ${isDarkMode
                      ? "bg-black/20 border border-white/10 text-white focus:border-indigo-500 focus:bg-black/40 group-hover:border-white/20 [&::-webkit-calendar-picker-indicator]:invert"
                      : "bg-white border border-slate-200 text-slate-900 focus:border-indigo-500"
                    }`}
                />
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-indigo-400 transition-colors duration-300" />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Bitiş</label>
              <div className="relative group">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className={`w-full pl-11 pr-4 py-3 text-sm rounded-xl outline-none transition-all duration-300 ${isDarkMode
                      ? "bg-black/20 border border-white/10 text-white focus:border-indigo-500 focus:bg-black/40 group-hover:border-white/20 [&::-webkit-calendar-picker-indicator]:invert"
                      : "bg-white border border-slate-200 text-slate-900 focus:border-indigo-500"
                    }`}
                />
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-indigo-400 transition-colors duration-300" />
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">İşlem Türü</label>
              <div className="relative group">
                <select
                  value={type}
                  onChange={(e) => { setType(e.target.value as "EARN" | "BURN" | "VOID" | "ALL"); setPage(1); }}
                  className={`w-full pl-4 pr-10 py-3 text-sm rounded-xl outline-none transition-all duration-300 appearance-none cursor-pointer ${isDarkMode
                      ? "bg-black/20 border border-white/10 text-white focus:border-indigo-500 focus:bg-black/40 group-hover:border-white/20"
                      : "bg-white border border-slate-200 text-slate-900 focus:border-indigo-500"
                    }`}
                >
                  <option value="ALL">Tüm İşlemler</option>
                  <option value="EARN">Puan Yükleme (Earn)</option>
                  <option value="BURN">Puan Harcama (Burn)</option>
                  <option value="VOID">İptal / Ters Kayıt</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover:text-indigo-400 transition-colors" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-white/5 gap-4">
            <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
              Toplam <span className="text-slate-200 font-bold">{totalCount}</span> kayıt bulundu
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleResetFilters}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 hover:bg-white/5 text-slate-400 hover:text-slate-200 cursor-pointer text-center"
              >
                Sıfırla
              </button>
              <button
                onClick={loadData}
                disabled={loading}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:-translate-y-[1px] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span>Yenile</span>
              </button>
            </div>
          </div>
        </GlassPanel>

        {/* 📊 İşlem Listesi (List/Card Grid) */}
        <div className="space-y-4 relative min-h-[400px]">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && transactions.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500/50 mb-4" />
              <p className="font-bold uppercase tracking-widest text-xs">Veriler Yükleniyor...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-600" />
              </div>
              <p className="font-bold uppercase tracking-widest text-xs">Kayıt Bulunamadı</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-3"
            >
              {transactions.map((tx) => {
                const isVoided = tx.status === "VOIDED";
                const isVoidRecord = tx.type === "VOID";
                const isEarn = tx.type === "EARN";

                return (
                  <motion.div
                    key={tx.id}
                    variants={itemVariants}
                    className={`group relative p-5 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden ${
                      isVoided
                        ? "bg-rose-950/5 border-rose-500/10 opacity-75"
                        : isVoidRecord
                          ? "bg-red-950/10 border-red-500/20"
                          : "bg-[#0a0a0a]/60 backdrop-blur-xl border-white/5 hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-[2px] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.3)] hover:shadow-indigo-500/10"
                    }`}
                  >
                    {/* Status Indicator Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300 ${
                      isVoided ? "bg-slate-700/50" : isVoidRecord ? "bg-red-500/80" : isEarn ? "bg-emerald-500/80 group-hover:bg-emerald-400" : "bg-rose-500/80 group-hover:bg-rose-400"
                    }`} />

                    <div className="flex flex-col md:flex-row md:items-center gap-6 pl-2 w-full md:w-auto">
                      {/* Date & Time */}
                      <div className="min-w-[120px] flex md:block items-center justify-between md:justify-start">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 md:mb-1.5 flex items-center gap-1.5">
                          <Clock size={10} /> Tarih
                        </p>
                        <p className="text-[13px] font-mono text-slate-300">{tx.createdAtFormatted}</p>
                      </div>

                      {/* Customer */}
                      <div className="min-w-[160px]">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 hidden md:block">Müşteri</p>
                        <button
                          onClick={() => handleOpenCustomerCard(tx.customerName, tx.customerPhone, tx.customerId)}
                          className="text-sm font-bold text-slate-200 hover:text-indigo-400 transition-colors flex items-center gap-2 cursor-pointer text-left"
                        >
                          <span className={isVoided ? "line-through decoration-rose-500/50" : ""}>{tx.customerName}</span>
                          <Info size={12} className="text-indigo-400/40" />
                        </button>
                        <div className="text-[11px] text-slate-400 font-mono mt-1 opacity-80">{tx.customerPhone}</div>
                      </div>

                      {/* Type Badge */}
                      <div className="min-w-[120px] hidden lg:block">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">İşlem Türü</p>
                        {isVoided ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/50 border border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <XCircle size={10} /> İptal Edildi
                          </div>
                        ) : isVoidRecord ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                            <AlertTriangle size={10} /> Ters Kayıt
                          </div>
                        ) : isEarn ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                            <CheckCircle2 size={10} /> Puan Yükleme
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                            <RefreshCw size={10} /> Puan Harcama
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8 w-full md:w-auto pl-2 md:pl-0 border-t border-white/5 md:border-0 pt-4 md:pt-0">
                      {/* Amount Spent */}
                      <div className="text-left md:text-right">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Harcama</p>
                        <p className={`text-[15px] font-mono font-bold ${isVoided ? "text-slate-500 line-through" : "text-slate-200"}`}>
                          {formatCurrency(tx.amountSpent)}
                        </p>
                      </div>

                      {/* Points */}
                      <div className="text-right min-w-[100px]">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Kazanılan/Harcanan</p>
                        <p className={`text-[15px] font-mono font-black ${
                          isVoided ? "text-slate-500 line-through" : 
                          isVoidRecord ? "text-red-400" : 
                          isEarn ? "text-emerald-400" : "text-rose-400"
                        }`}>
                          {tx.pointsAmount > 0 ? `+${tx.pointsAmount}` : tx.pointsAmount} Pts
                        </p>
                      </div>

                      {/* Action */}
                      <div className="min-w-[40px] md:min-w-[120px] flex justify-end">
                        {!isVoided && !isVoidRecord && (
                          <button
                            onClick={() => handleVoid(tx.id)}
                            disabled={voidingId !== null}
                            className="h-10 px-3 md:px-4 rounded-xl bg-red-500/5 hover:bg-red-500/15 text-red-400 border border-red-500/10 hover:border-red-500/30 text-[11px] font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed opacity-100 md:opacity-0 md:-translate-x-4 group-hover:opacity-100 group-hover:translate-x-0"
                            title="İşlemi İptal Et"
                          >
                            {voidingId === tx.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle size={16} />
                                <span className="hidden md:inline">İptal Et</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* 🔘 Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 px-2 py-4 border-t border-white/5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="h-11 px-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/30 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 cursor-pointer hover:-translate-x-1"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Önceki Sayfa</span>
            </button>

            <span className="text-[11px] font-bold text-slate-400 font-mono tracking-widest uppercase">
              Sayfa {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="h-11 px-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/30 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 cursor-pointer hover:translate-x-1"
            >
              <span className="hidden sm:inline">Sonraki Sayfa</span>
              <ChevronDown size={14} className="-rotate-90" />
            </button>
          </div>
        )}
      </main>

      {/* 🪪 Müşteri Detay Drawer / Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-lg rounded-3xl border overflow-hidden shadow-2xl backdrop-blur-xl transition-all duration-300 z-10 ${isDarkMode
                  ? "bg-[#0b0f19]/95 border-indigo-500/20 text-white shadow-indigo-500/5"
                  : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-200"
                }`}
            >
              <button
                onClick={() => setSelectedCustomer(null)}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="p-6 border-b border-white/5 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 mb-4 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                  <User size={24} />
                </div>
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 tracking-wide">
                  {selectedCustomer.name}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-1 tracking-wider uppercase">Sadakat Müşteri Kartı</p>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-3 font-medium text-xs">
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Phone size={16} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-0.5">Telefon Numarası</p>
                      <p className="text-slate-200 font-mono text-sm">{selectedCustomer.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Mail size={16} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-0.5">Kasiyer E-postası</p>
                      <p className="text-slate-200 font-mono text-sm">{selectedCustomer.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Clock size={12} /> Bu Sayfadaki Son İşlemleri
                  </h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {selectedCustomer.txs.map((tx) => (
                      <div key={tx.id} className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors flex items-center justify-between text-xs group">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-300 flex items-center gap-1.5">
                            {tx.type === "EARN" ? <span className="text-emerald-400"><CheckCircle2 size={12} /></span> : tx.type === "BURN" ? <span className="text-rose-400"><RefreshCw size={12} /></span> : <span className="text-red-400"><XCircle size={12} /></span>}
                            {tx.type === "EARN" ? "Puan Yükleme" : tx.type === "BURN" ? "Puan Harcama" : "İptal Logu"}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">{tx.createdAtFormatted}</p>
                        </div>
                        <span className={`font-mono font-black text-[13px] ${tx.pointsAmount > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {tx.pointsAmount > 0 ? `+${tx.pointsAmount}` : tx.pointsAmount} Pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
