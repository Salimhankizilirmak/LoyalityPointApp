"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { 
  getManagerProfile, 
  getBranchTransactions, 
  getCustomers, 
  getOrgMembers,
  removeMember,
  updateMemberName,
  addCustomerAction,
  updateCustomer,
  deleteCustomer,
  toggleStaffStatus
} from "@/app/(manager)/manager-dashboard/actions";
import { Transaction, Customer, Employee } from "../types";
import { getInvitationsAction } from "@/app/actions/invitation-actions";

interface InvitationItem {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date | number | null;
  branchName?: string | null;
}

// Debounce helper to protect database quotas
function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export function useManagerDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showMockData, setShowMockData] = useState(false);
  
  // Real Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cashiers, setCashiers] = useState<Employee[]>([]);
  const [branchInfo, setBranchInfo] = useState<{id: string, name: string, orgId: string} | null>(null);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  
  // Loading and Error States
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounced Search States
  const [customerSearch, setCustomerSearch] = useState("");
  const debouncedCustomerSearch = useDebounce(customerSearch, 300);

  const [transactionSearch, setTransactionSearch] = useState("");
  const debouncedTransactionSearch = useDebounce(transactionSearch, 300);

  const { user } = useUser();

  const refreshData = useCallback(async () => {
    try {
      const [profile, txs, custs, emps, invitesList] = await Promise.all([
        getManagerProfile(),
        getBranchTransactions(),
        getCustomers(debouncedCustomerSearch),
        getOrgMembers(),
        getInvitationsAction()
      ]);
      
      setInvitations(invitesList);
      setBranchInfo({ id: profile.branchId, name: profile.branchName, orgId: profile.orgId || "" });
      
      const mappedTxs: Transaction[] = (txs as { id: string; customerFirstName?: string | null; customerLastName?: string | null; transactionType: string; amount: number; createdAt: Date | null; status?: string; parentTransactionId?: string | null }[]).map(t => ({
        id: t.id,
        customer: `${t.customerFirstName || ""} ${t.customerLastName || ""}`.trim() || "Bilinmeyen Müşteri",
        type: t.transactionType === "void" ? "void" : (t.transactionType === "earn" ? "earned" : t.transactionType === "spend" ? "spent" : "new"),
        pts: t.amount,
        amount: t.amount * 2, // Mock ciro hesabı
        cashier: "Kasiyer",
        time: t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--",
        status: t.status,
        parentTransactionId: t.parentTransactionId
      }));

      setTransactions(mappedTxs);
      setCustomers(custs as Customer[]);
      
      // Sadece kasiyerleri filtrele
      const filteredCashiers = (emps as Employee[]).filter(e => e.role === "cashier");
      setCashiers(filteredCashiers);
    } catch (err) {
      console.error("Manager data fetch error:", err);
      setError("Veriler senkronize edilirken bir sunucu hatası oluştu.");
    }
  }, [debouncedCustomerSearch]);

  // Fetch data only once user context is loaded
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (user && active) {
        await refreshData();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [user, refreshData]);

  // Debounced Search Trigger (Protects DB by skipping redundant queries)
  useEffect(() => {
    let active = true;
    const loadCustomers = async () => {
      if (user) {
        try {
          const custs = await getCustomers(debouncedCustomerSearch);
          if (active) {
            setCustomers(custs as Customer[]);
          }
        } catch (err) {
          console.error("Manager customer search error:", err);
        }
      }
    };
    loadCustomers();
    return () => {
      active = false;
    };
  }, [debouncedCustomerSearch, user]);

  // Actions
  const handleRemoveCashier = async (id: string) => {
    if (!confirm("Bu kasiyeri silmek istediğinize emin misiniz?")) return;
    setLoadingId(id);
    try {
      await removeMember(id);
      await refreshData();
    } catch (err) {
      console.error(err);
      setError("Kasiyer kaydı silinemedi.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleUpdateCashier = async (id: string, f: string, l: string) => {
    setLoadingId(id);
    try {
      await updateMemberName(id, f, l);
      await refreshData();
    } catch (err) {
      console.error(err);
      setError("Kasiyer ismi güncellenemedi.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleAddCustomer = async (data: { firstName: string; lastName: string; phone: string; email: string }) => {
    try {
      const res = await addCustomerAction(data.firstName, data.lastName, data.phone, data.email);
      if (res && "error" in res) {
        setError(String(res.error));
      } else {
        await refreshData();
      }
    } catch (err) {
      console.error(err);
      setError("Müşteri kaydı eklenirken bir hata oluştu.");
    }
  };

  const handleUpdateCustomer = async (id: string, data: Partial<Customer>) => {
    setLoadingId(id);
    try {
      await updateCustomer(id, data);
      await refreshData();
    } catch (err) {
      console.error(err);
      setError("Müşteri bilgileri güncellenemedi.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Bu müşteriyi silmek istediğinize emin misiniz?")) return;
    setLoadingId(id);
    try {
      await deleteCustomer(id);
      await refreshData();
    } catch (err) {
      console.error(err);
      setError("Müşteri kaydı silinemedi.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    setLoadingId(id);
    try {
      const res = await toggleStaffStatus(id, currentActive);
      if (res && "error" in res) {
        setError(String(res.error));
      } else {
        await refreshData();
      }
    } catch (err) {
      console.error(err);
      setError("Kasiyer aktiflik durumu değiştirilemedi.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleEditPointsSave = async (tx: Transaction) => {
    // Düzeltme işlemi sonrası verileri tazele
    console.log("[useManagerDashboard] Puan düzeltme kaydedildi:", tx.id);
    await refreshData();
  };

  // Client-side search filters optimized with debounce values
  const filteredCustomers = customers.filter(c => {
    if (!debouncedCustomerSearch) return true;
    const query = debouncedCustomerSearch.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(query) ||
      c.lastName.toLowerCase().includes(query) ||
      c.phone.includes(query)
    );
  });

  const filteredTransactions = transactions.filter(t => {
    if (!debouncedTransactionSearch) return true;
    const query = debouncedTransactionSearch.toLowerCase();
    return (
      t.customer.toLowerCase().includes(query) ||
      t.cashier.toLowerCase().includes(query) ||
      t.type.toLowerCase().includes(query)
    );
  });

  return {
    activeTab,
    setActiveTab,
    isDarkMode,
    setIsDarkMode,
    showMockData,
    setShowMockData,
    transactions: filteredTransactions,
    rawTransactions: transactions,
    customers: filteredCustomers,
    rawCustomers: customers,
    cashiers,
    branchInfo,
    loadingId,
    error,
    setError,
    customerSearch,
    setCustomerSearch,
    transactionSearch,
    setTransactionSearch,
    refreshData,
    handleRemoveCashier,
    handleUpdateCashier,
    handleAddCustomer,
    handleUpdateCustomer,
    handleDeleteCustomer,
    handleToggleStatus,
    handleEditPointsSave,
    invitations
  };
}
