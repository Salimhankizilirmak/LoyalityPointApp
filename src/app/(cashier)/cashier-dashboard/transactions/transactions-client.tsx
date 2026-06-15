"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, Calendar,
  Filter, ChevronDown, RefreshCw, AlertTriangle,
  ArrowUpDown, User, Mail, Phone, Info, X
} from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { getFilteredTransactionsAction, voidTransactionAction, getBranchCustomerInvitationsAction } from "../actions";
import { CashierDashboardModals } from "@/components/features/cashier-dashboard/modals/CashierDashboardModals";
import { Header } from "@/components/features/cashier-dashboard/ui/Header";


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
  const [activeTab, setActiveTab] = useState<"transactions" | "customers">("transactions");
  const [invitations, setInvitations] = useState<any[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");

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
    if (activeTab === "customers") {
      loadInvitations();
    }
  }, [activeTab, loadInvitations]);

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
    <div className={`min-h-screen flex flex-col font-sans select-none antialiased transition-colors duration-300 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"
      }`}>
      {/* Oturum Kapama Modalı */}
      <CashierDashboardModals
        branchStatus={null}
        showAddCustomer={false}
        setShowAddCustomer={() => { }}
        handleAddCustomer={async () => { }}
      />

      {/* Ortak Navigasyon Header */}
      <Header
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        branchName={cashierInfo.branchName}
        clerkUser={clerkUser}
        signOut={() => signOut({ redirectUrl: "/" })}
      />

      {/* 📊 Ana Bölüm Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* 📑 Sekme Seçici */}
        <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "transactions"
                ? "bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                : "text-slate-400 hover:text-slate-200"
              }`}
          >
            İşlemler
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "customers"
                ? "bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                : "text-slate-400 hover:text-slate-200"
              }`}
          >
            Müşteriler
          </button>
        </div>

        {/* 🔍 Gelişmiş Filtreleme Paneli */}
        {activeTab === "transactions" && (
          <GlassPanel className="p-6 bg-[#0a0a0f]/40 border-cyan-500/15 shadow-xl relative overflow-hidden" elevated>
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Arama ve Filtreleme Kontrolleri</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Quick Text Query */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Müşteri Bilgileri</label>
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                    placeholder="İsim, telefon veya e-posta..."
                    className={`w-full pl-10 pr-4 py-2 text-sm border rounded-xl outline-none transition-all ${isDarkMode
                        ? "bg-[#09090b]/80 border-white/10 text-white focus:border-cyan-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500"
                      }`}
                  />
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              {/* Date Range - Start */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Başlangıç Tarihi</label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                    className={`w-full pl-10 pr-4 py-2 text-sm border rounded-xl outline-none transition-all ${isDarkMode
                        ? "bg-[#09090b]/80 border-white/10 text-white focus:border-cyan-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500"
                      }`}
                  />
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              {/* Date Range - End */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Bitiş Tarihi</label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                    className={`w-full pl-10 pr-4 py-2 text-sm border rounded-xl outline-none transition-all ${isDarkMode
                        ? "bg-[#09090b]/80 border-white/10 text-white focus:border-cyan-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500"
                      }`}
                  />
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              {/* Type Filter */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">İşlem Türü</label>
                <select
                  value={type}
                  onChange={(e) => { setType(e.target.value as "EARN" | "BURN" | "VOID" | "ALL"); setPage(1); }}
                  className={`w-full px-3 py-2 text-sm border rounded-xl outline-none transition-all appearance-none cursor-pointer ${isDarkMode
                      ? "bg-[#09090b]/80 border-white/10 text-white focus:border-cyan-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500"
                    }`}
                >
                  <option value="ALL">Tümü</option>
                  <option value="EARN">Puan Yükleme (Earn)</option>
                  <option value="BURN">Puan Harcama (Burn)</option>
                  <option value="VOID">İptal Ters Kaydı (Void)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">İşlem Durumu</label>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value as "SUCCESS" | "VOIDED" | "ALL"); setPage(1); }}
                  className={`w-full px-3 py-2 text-sm border rounded-xl outline-none transition-all appearance-none cursor-pointer ${isDarkMode
                      ? "bg-[#09090b]/80 border-white/10 text-white focus:border-cyan-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500"
                    }`}
                >
                  <option value="ALL">Tümü</option>
                  <option value="SUCCESS">Başarılı (Success)</option>
                  <option value="VOIDED">İptal Edilmiş (Voided)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
              <button
                onClick={handleResetFilters}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isDarkMode
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                Filtreleri Temizle
              </button>
              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Yenile</span>}
              </button>
            </div>
          </GlassPanel>
        )}

        {/* 📊 Performans Odaklı Glassmorphic Tablo */}
        {activeTab === "transactions" && (
          <GlassPanel className="p-6 bg-[#0a0a0f]/40 border-indigo-500/15 shadow-xl relative overflow-hidden" elevated>
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Table container with fixed height limit to prevent scroll spill */}
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
                    <th onClick={() => toggleSort("createdAt")} className="p-4 cursor-pointer hover:text-cyan-400 transition-colors">
                      <span className="flex items-center gap-1">Tarih <ArrowUpDown size={11} /></span>
                    </th>
                    <th onClick={() => toggleSort("customerName")} className="p-4 cursor-pointer hover:text-cyan-400 transition-colors">
                      <span className="flex items-center gap-1">Müşteri <ArrowUpDown size={11} /></span>
                    </th>
                    <th className="p-4">Tür</th>
                    <th onClick={() => toggleSort("pointsAmount")} className="p-4 text-right cursor-pointer hover:text-cyan-400 transition-colors">
                      <span className="flex items-center justify-end gap-1">Puan <ArrowUpDown size={11} /></span>
                    </th>
                    <th onClick={() => toggleSort("amountSpent")} className="p-4 text-right cursor-pointer hover:text-cyan-400 transition-colors">
                      <span className="flex items-center justify-end gap-1">Harcama <ArrowUpDown size={11} /></span>
                    </th>
                    <th className="p-4 text-center">Kasiyer</th>
                    <th className="p-4 text-right pr-6">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-white/5">
                  {loading && transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-20 text-slate-500 font-bold uppercase tracking-wider">
                        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-2" />
                        Yükleniyor...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-20 text-slate-500 font-bold uppercase tracking-wider">
                        Uyumlu işlem bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isVoided = tx.status === "VOIDED";
                      const isVoidRecord = tx.type === "VOID";
                      const isEarn = tx.type === "EARN";

                      return (
                        <tr
                          key={tx.id}
                          className={`transition-colors border-b border-white/5 ${isVoided
                              ? "bg-rose-950/5 text-slate-500 line-through decoration-rose-500/30"
                              : isVoidRecord
                                ? "bg-red-950/10"
                                : "hover:bg-white/[0.02]"
                            }`}
                        >
                          <td className="p-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {tx.createdAtFormatted}
                          </td>
                          <td className="p-4 font-bold text-slate-200">
                            <button
                              onClick={() => handleOpenCustomerCard(tx.customerName, tx.customerPhone, tx.customerId)}
                              className="hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <span>{tx.customerName}</span>
                              <Info size={12} className="text-cyan-400/50" />
                            </button>
                            <div className="text-[10px] text-slate-500 font-mono font-medium mt-0.5">{tx.customerPhone}</div>
                          </td>
                          <td className="p-4">
                            {isVoided && (
                              <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[9px] font-bold text-red-400 uppercase tracking-wider">
                                İptal (Voided)
                              </span>
                            )}
                            {!isVoided && isVoidRecord && (
                              <span className="px-2 py-0.5 rounded bg-red-600/20 border border-red-500/30 text-[9px] font-bold text-red-300 uppercase tracking-wider">
                                Ters Kayıt (Void)
                              </span>
                            )}
                            {!isVoided && !isVoidRecord && isEarn && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                                Kazanım (Earn)
                              </span>
                            )}
                            {!isVoided && !isVoidRecord && !isEarn && (
                              <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[9px] font-bold text-rose-400 uppercase tracking-wider">
                                Harcama (Burn)
                              </span>
                            )}
                          </td>
                          <td className={`p-4 text-right font-mono font-bold ${isVoidRecord ? "text-red-400" : isEarn ? "text-emerald-400" : "text-rose-400"
                            }`}>
                            {tx.pointsAmount > 0 ? `+${tx.pointsAmount}` : tx.pointsAmount} Puan
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-slate-300">
                            {formatCurrency(tx.amountSpent)}
                          </td>
                          <td className="p-4 text-center font-medium text-slate-400">
                            {tx.cashierName}
                          </td>
                          <td className="p-4 text-right pr-6">
                            {!isVoided && !isVoidRecord && (
                              <button
                                onClick={() => handleVoid(tx.id)}
                                disabled={voidingId !== null}
                                className="h-10 px-4 rounded-xl bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                {voidingId === tx.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  "İptal Et (Void)"
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 🔘 Pagination and Count controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="h-12 px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/20 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Önceki</span>
                </button>

                <span className="text-xs font-bold text-slate-400 font-mono">
                  Sayfa {page} / {totalPages} (Toplam {totalCount} Kayıt)
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className="h-12 px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/20 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Sonraki</span>
                  <ChevronDown size={14} className="-rotate-90" />
                </button>
              </div>
            )}
          </GlassPanel>
        )}

        {/* 👥 Müşteriler ve Davetler Tablosu */}
        {activeTab === "customers" && (
          <GlassPanel className="p-6 bg-[#0a0a0f]/40 border-indigo-500/15 shadow-xl relative overflow-hidden" elevated>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Şube Müşterileri ve Davetleri</h2>
                <p className="text-[10px] text-slate-500 mt-1">Şubeye ait tüm davet ve kayıt durumları</p>
              </div>
              <div className="relative group w-full sm:w-64">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Ad, e-posta veya telefon ara..."
                  className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs outline-none transition-all placeholder-slate-600 min-h-[38px] ${isDarkMode
                      ? "bg-[#09090b]/80 border-white/10 text-white focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500"
                    }`}
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
                    <th className="p-4">Ad / E-posta</th>
                    <th className="p-4">Telefon</th>
                    <th className="p-4 text-center">Durum</th>
                    <th className="p-4 text-right pr-6">Puan</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-white/5">
                  {invitationsLoading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-20 text-slate-500 font-bold uppercase tracking-wider">
                        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-2" />
                        Yükleniyor...
                      </td>
                    </tr>
                  ) : (() => {
                    const filtered = invitations.filter((invite) => {
                      if (!customerSearchQuery.trim()) return true;
                      const q = customerSearchQuery.toLowerCase().trim();
                      const nameMatch = (invite.customerName || "").toLowerCase().includes(q);
                      const emailMatch = (invite.email || "").toLowerCase().includes(q);
                      const phoneMatch = (invite.phoneNumber || "").toLowerCase().includes(q);
                      return nameMatch || emailMatch || phoneMatch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="text-center py-20 text-slate-500 font-bold uppercase tracking-wider">
                            Henüz davet veya kayıt bulunmuyor.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((invite) => {
                      const isAccepted = invite.status === "ACCEPTED";
                      return (
                        <tr key={invite.id} className="transition-colors border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="p-4">
                            <div className="font-bold text-slate-200">
                              {invite.customerName || "İsimsiz Müşteri"}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{invite.email}</div>
                          </td>
                          <td className="p-4 font-mono font-medium text-slate-300">
                            {invite.phoneNumber || "Belirtilmemiş"}
                          </td>
                          <td className="p-4 text-center">
                            {isAccepted ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                                KABUL EDİLDİ
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                                BEKLEYEN
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right pr-6 font-mono font-bold text-cyan-400">
                            {isAccepted ? `${invite.totalPoints ?? 0} Puan` : "—"}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </GlassPanel>
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
                  ? "bg-[#0b0f19]/95 border-cyan-500/20 text-white shadow-cyan-500/5"
                  : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-200"
                }`}
            >
              <button
                onClick={() => setSelectedCustomer(null)}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="p-6 border-b border-white/5">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400 mb-3">
                  <User size={22} />
                </div>
                <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">
                  {selectedCustomer.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Sadakat Müşteri Bilgi Kartı</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-3 font-medium text-xs">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/5 bg-white/[0.01]">
                    <Phone size={14} className="text-cyan-400" />
                    <div>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Telefon Numarası</p>
                      <p className="text-slate-200 font-mono mt-0.5">{selectedCustomer.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/5 bg-white/[0.01]">
                    <Mail size={14} className="text-cyan-400" />
                    <div>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Kasiyer E-postası</p>
                      <p className="text-slate-200 font-mono mt-0.5">{selectedCustomer.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Bu Sayfadaki Son İşlemleri</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedCustomer.txs.map((tx) => (
                      <div key={tx.id} className="p-3 rounded-lg border border-white/5 bg-white/[0.01] flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-300">
                            {tx.type === "EARN" ? "Puan Yükleme" : tx.type === "BURN" ? "Puan Harcama" : "İptal Logu"}
                          </p>
                          <p className="text-[9px] text-slate-500">{tx.createdAtFormatted}</p>
                        </div>
                        <span className={`font-mono font-bold ${tx.pointsAmount > 0 ? "text-emerald-400" : "text-rose-400"}`}>
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
