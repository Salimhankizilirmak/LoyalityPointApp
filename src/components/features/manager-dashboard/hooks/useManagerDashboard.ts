"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { deleteStaffMemberAction } from "@/app/actions/staff-management";
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
  toggleStaffStatus,
  getRecentActivities,
  getStoreSettingsAction
} from "@/app/(manager)/manager-dashboard/actions";
import { getCampaignsAction } from "@/app/(manager)/manager-dashboard/campaign-actions";
import { Transaction, Customer, Employee, ActivityItem, ActivityType } from "../types";
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

export function useManagerDashboard(initialData?: any) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Real Data State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (initialData?.transactions) {
      return (initialData.transactions as any[]).map(t => ({
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
    }
    return [];
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const baseCusts = ((initialData?.customers || []) as Customer[]).map(c => ({...c, status: "active" as const}));
    const pendingCustomerInvites: Customer[] = (initialData?.invitations || [])
      .filter((inv: any) => inv.status !== "ACCEPTED" && (inv.role === "CUSTOMER" || inv.role === "customer"))
      .map((inv: any) => ({
        id: `inv-${inv.id}`,
        firstName: inv.email.split("@")[0],
        lastName: "(Davet Bekliyor)",
        phone: "-",
        email: inv.email,
        currentPoints: 0,
        status: "pending",
        createdAt: inv.createdAt,
      }));
    return [...baseCusts, ...pendingCustomerInvites];
  });
  const [cashiers, setCashiers] = useState<Employee[]>(() => {
    let baseCashiers: Employee[] = [];
    if (initialData?.members) {
      baseCashiers = (initialData.members as Employee[]).filter(e => e.role === "cashier");
    }
    const pendingInvites: Employee[] = (initialData?.invitations || [])
      .filter((inv: any) => inv.status !== "ACCEPTED" && (inv.role === "admin" || inv.role === "manager" || inv.role === "cashier" || inv.role === "CASHIER" || inv.role === "MANAGER"))
      .map((inv: any) => ({
      id: `inv-${inv.id}`,
      name: inv.email.split("@")[0],
      email: inv.email,
      role: inv.role.toLowerCase() === "admin" ? "manager" : "cashier",
      status: "pending",
      avatar: "",
      createdAt: inv.createdAt,
    }));
    return [...baseCashiers, ...pendingInvites];
  });
  const [branchInfo, setBranchInfo] = useState<{id: string, name: string, orgId: string} | null>(() => {
    if (initialData?.profile) {
      return { 
        id: initialData.profile?.branchId || "", 
        name: initialData.profile?.branchName || "Yükleniyor...", 
        orgId: initialData.profile?.orgId || "" 
      };
    }
    return null;
  });
  const [invitations, setInvitations] = useState<InvitationItem[]>(() => initialData?.invitations || []);
  const [campaigns, setCampaigns] = useState<any[]>(() => initialData?.campaigns || []);
  const [activityLogsDb, setActivityLogsDb] = useState<any[]>(() => initialData?.activities || []);
  const [storeSettings, setStoreSettings] = useState({ pointsEquivalent: 1, tlEquivalent: 1, earnRatio: 10 });
  
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
      const [profile, txs, custs, emps, invitesList, campaignsRes, activities, settings] = await Promise.all([
        getManagerProfile(),
        getBranchTransactions(),
        getCustomers(debouncedCustomerSearch),
        getOrgMembers(),
        getInvitationsAction(),
        getCampaignsAction(),
        getRecentActivities(),
        getStoreSettingsAction()
      ]);
      
      setInvitations(invitesList);
      setActivityLogsDb(activities);
      if (settings && !('error' in settings)) setStoreSettings(settings as any);
      if (campaignsRes?.success && campaignsRes.campaigns) {
        setCampaigns(campaignsRes.campaigns);
      }
      setBranchInfo({ 
        id: profile?.branchId || "", 
        name: profile?.branchName || "Yükleniyor...", 
        orgId: profile?.orgId || "" 
      });
      
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
      const baseCusts = (custs as Customer[]).map(c => ({...c, status: "active" as const}));
      const pendingCustomerInvites: Customer[] = invitesList
        .filter((inv: any) => inv.status !== "ACCEPTED" && (inv.role === "CUSTOMER" || inv.role === "customer"))
        .map((inv: any) => ({
          id: `inv-${inv.id}`,
          firstName: inv.email.split("@")[0],
          lastName: "(Davet Bekliyor)",
          phone: "-",
          email: inv.email,
          currentPoints: 0,
          status: "pending",
          createdAt: inv.createdAt,
        }));
      setCustomers([...baseCusts, ...pendingCustomerInvites]);
      
      // Kasiyerleri ve davetleri filtreleyip birleştir
      const filteredCashiers = (emps as Employee[]).filter(e => e.role === "cashier");
      const pendingInvites: Employee[] = invitesList
        .filter((inv: any) => inv.status !== "ACCEPTED" && (inv.role === "admin" || inv.role === "manager" || inv.role === "cashier" || inv.role === "CASHIER" || inv.role === "MANAGER"))
        .map((inv: any) => ({
        id: `inv-${inv.id}`,
        name: inv.email.split("@")[0],
        email: inv.email,
        role: inv.role.toLowerCase() === "admin" ? "manager" : "cashier",
        status: "pending",
        avatar: "",
        createdAt: inv.createdAt,
      }));
      setCashiers([...filteredCashiers, ...pendingInvites]);
    } catch (err) {
      console.error("Manager data fetch error:", err);
      setError("Veriler senkronize edilirken bir sunucu hatası oluştu.");
    }
  }, [debouncedCustomerSearch]);

  const hasInitialData = !!(initialData && initialData.profile);
  // Fetch data only once user context is loaded if initialData is NOT provided
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (user && active && !hasInitialData) {
        await refreshData();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [user, refreshData, hasInitialData]);

  // Debounced Search Trigger (Protects DB by skipping redundant queries)
  useEffect(() => {
    let active = true;
    const loadCustomers = async () => {
      if (user) {
        // Arama sorgusu boşsa veritabanından çekme (zaten initialData'da var)
        if (debouncedCustomerSearch === "") {
          return;
        }
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
    if (!confirm("Bu kasiyeri sistemden ve organizasyondan kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) return;
    setLoadingId(id);
    try {
      if (id.startsWith("inv-")) {
        await removeMember(id);
      } else {
        const res = await deleteStaffMemberAction(id, "CASHIER");
        if (res && !res.success) {
          setError(res.error || "Silinemedi.");
        }
      }
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

  // Unified Activity Feed — transactions + invitations merged & sorted by time desc
  const activityFeed: ActivityItem[] = [
    // Map loyalty transactions
    ...transactions.map((tx): ActivityItem => {
      const isVoided = tx.status === "VOIDED" || tx.type === "void";
      const actType: ActivityType = isVoided ? "void" : (tx.type === "earned" ? "earned" : tx.type === "spent" ? "spent" : "earned");
      return {
        id: String(tx.id),
        type: actType,
        actorName: tx.cashier || "Kasiyer",
        targetName: tx.customer,
        pts: tx.pts,
        amount: tx.amount,
        time: tx.time,
        rawTime: 0, // transactions have no raw ms in current shape; sort stable
        status: tx.status,
        originalTx: tx,
      };
    }),
    // Map invitations
    ...invitations.map((inv): ActivityItem => {
      const isAccepted = inv.status === "ACCEPTED";
      const isCashier = inv.role === "admin" || inv.role === "manager" || inv.role === "cashier";
      let actType: ActivityType;
      if (isCashier) {
        actType = isAccepted ? "cashier_accepted" : "cashier_invited";
      } else {
        actType = isAccepted ? "customer_accepted" : "customer_invited";
      }
      const rawMs = inv.createdAt ? (typeof inv.createdAt === "number" ? inv.createdAt : new Date(inv.createdAt as Date).getTime()) : 0;
      return {
        id: `inv-${inv.id}`,
        type: actType,
        actorName: inv.email.split("@")[0],
        time: inv.createdAt ? new Date(inv.createdAt as Date).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "--:--",
        rawTime: rawMs,
      };
    }),
    /* Mock campaign updates removed, backend activityLogs now holds true records */
    // Map db activityLogs (Registration, Adjustments vs)
    ...activityLogsDb.map((al): ActivityItem => {
      const isReject = String(al.type).includes("REJECTED");
      const isApprove = String(al.type).includes("APPROVED");
      let actType: ActivityType = "system";
      if (isReject) actType = "void";
      if (isApprove) actType = "earned";
      
      const logTime = new Date(al.createdAt * 1000); // unix timestamp assumed from activityLogs default
      return {
        id: `db-log-${al.id}`,
        type: actType,
        actorName: al.actorName || "Yetkili",
        targetName: al.targetName || "",
        time: logTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short", year: "numeric" }),
        rawTime: logTime.getTime(),
        description: al.description,
        metadata: al.metadata
      };
    }),
  ].sort((a, b) => b.rawTime - a.rawTime);

  return {
    isDarkMode,
    setIsDarkMode,
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
    invitations,
    activityFeed,
    storeSettings,
  };
}
