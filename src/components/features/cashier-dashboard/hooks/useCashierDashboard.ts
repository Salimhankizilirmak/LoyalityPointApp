"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { 
  searchCustomerAction, 
  earnPointsAction, 
  burnPointsAction, 
  registerCustomerAction, 
  getBranchStatus,
  getCustomerRecentTransactionsAction
} from "@/app/(cashier)/cashier-dashboard/actions";



export interface CustomerData {
  id: string;
  name: string;
  phone: string;
  pts: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  totalTx: number;
  avatar: string;
  createdAt?: string; // Kayıt tarihi bilgisi için opsiyonel alan
}

export interface TransactionReceipt {
  customerName: string;
  customerPhone: string;
  txType: TxType;
  amount: string;
  ptsPreview: number;
  oldPoints: number;
  newPoints: number;
  timestamp: string;
  totalCartAmount?: number;
  ptsBurned?: number;
  cashPaid?: number;
  refId?: string;
}

export interface TransactionData {
  id: string;
  type: "EARN" | "BURN" | "VOID";
  amountSpent: number | null;
  pointsAmount: number;
  status: "SUCCESS" | "VOIDED";
  parentTransactionId?: string | null;
  createdAtFormatted: string;
}

export type TxType = "EARN" | "BURN" | null;

export function useCashierDashboard(initialBranchStatus?: { isActive: boolean; isDeleted: boolean } | null) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [txType, setTxType] = useState<TxType>(null);
  const [amount, setAmount] = useState("");
  const [totalCartAmount, setTotalCartAmount] = useState("");
  const [txSuccess, setTxSuccess] = useState(false);
  const [txError, setTxError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [stats, setStats] = useState({
    totalTxToday: 0,
    ptsGivenToday: 0,
    newMembersToday: 0
  });

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [branchStatus, setBranchStatus] = useState<{ isActive: boolean; isDeleted: boolean } | null>(initialBranchStatus || null);
  const [showSignOutOverlay, setShowSignOutOverlay] = useState(false);
  const { signOut } = useClerk();

  // Audit Modal States
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditTransactions, setAuditTransactions] = useState<TransactionData[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Invite Form States (Single Source of Truth)
  const [inviteForm, setInviteForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  
  // Last Transaction Receipt State
  const [lastTxReceipt, setLastTxReceipt] = useState<TransactionReceipt | null>(null);

  // Polling for branch status: Increased interval to 180 seconds to protect Turso DB quotas
  useEffect(() => {
    let active = true;
    const checkStatus = async () => {
      try {
        const status = await getBranchStatus();
        if (!active) return;
        if ("isActive" in status) {
          setBranchStatus({ isActive: status.isActive as boolean, isDeleted: status.isDeleted as boolean });
        } else {
          setBranchStatus({ isActive: false, isDeleted: true });
        }
      } catch (err) {
        console.error("Şube durum kontrolü hatası:", err);
        if (active) {
          setBranchStatus({ isActive: false, isDeleted: true });
        }
      }
    };
    
    if (!initialBranchStatus) {
      checkStatus();
    }
    const interval = setInterval(checkStatus, 180000); // 180s check (3 minutes)
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [initialBranchStatus]);

  // Global Toast auto-dismiss (3 seconds)
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const baseAmount = Number(amount) || 0;
  const ptsPreview = (!amount || !txType) ? 0 : (
    txType === "EARN"
      ? Math.floor((baseAmount * 10) / 100)  // varsayılan %10 oran
      : Math.min(Number(amount) || 0, customer?.pts ?? 0, Number(totalCartAmount) || Infinity)
  );

  const fetchAuditTransactions = useCallback(async (customerId: string, limit: number = 10) => {
    setAuditLoading(true);
    try {
      const res = await getCustomerRecentTransactionsAction(customerId, limit);
      if (res.success && res.transactions) {
        setAuditTransactions(res.transactions as TransactionData[]);
      } else {
        setTxError(res.error || "İşlem geçmişi yüklenemedi.");
      }
    } catch {
      setTxError("İşlem geçmişi sorgulanırken hata oluştu.");
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const handleScan = useCallback(async (phone: string) => {
    if (!phone) return;
    setScanning(true);
    setSearchError("");
    setTxError("");
    try {
      const result = await searchCustomerAction(phone);
      if ("error" in result) {
        setSearchError(result.error ?? "Arama hatası");
      } else if (result.found && result.customer) {
        const c = result.customer;
        
        // Kayıt tarihini formatla
        const formatter = new Intl.DateTimeFormat("tr-TR", {
          timeZone: "Europe/Istanbul",
          dateStyle: "short",
        });
        const cDate = c.createdAt ? formatter.format(new Date(c.createdAt)) : "Belirtilmemiş";

        setCustomer({
          id: c.id,
          name: c.name,
          phone: c.phoneNumber,
          pts: c.totalPoints,
          tier: "Bronze",
          totalTx: 0,
          avatar: c.name?.[0] ?? "?",
          createdAt: cDate,
        });
        fetchAuditTransactions(c.id);
        setScanInput("");
      } else {
        setSearchError("Müşteri bulunamadı");
      }
    } catch {
      setSearchError("Sorgulama hatası");
    } finally {
      setScanning(false);
    }
  }, [fetchAuditTransactions]);

  const handleTx = useCallback(async () => {
    if (!customer || !txType || !amount) return;
    setTxError("");

    startTransition(async () => {
      try {
        let result;
        if (txType === "EARN") {
          const amountSpentInKurus = Math.round(Number(amount) * 100);
          result = await earnPointsAction(customer.id, amountSpentInKurus);
        } else {
          const pointsToBurn = Math.round(Number(amount));
          const totalAmountVal = Number(totalCartAmount);
          result = await burnPointsAction(customer.id, pointsToBurn, totalAmountVal);
        }

        if ("error" in result && result.error) {
          setTxError(result.error || "İşlem başarısız");
        } else if ("success" in result && result.success) {
          const newTotal = "newTotal" in result ? (result as { newTotal: number }).newTotal : customer.pts;
          const refId = "refId" in result ? (result as { refId: string }).refId : undefined;
          const pointsBurned = txType === "BURN" ? Math.round(Number(amount)) : 0;
          
          setLastTxReceipt({
            customerName: customer.name,
            customerPhone: customer.phone,
            txType,
            amount,
            ptsPreview: txType === "EARN" ? ptsPreview : pointsBurned,
            oldPoints: customer.pts,
            newPoints: newTotal,
            totalCartAmount: txType === "BURN" ? Number(totalCartAmount) : undefined,
            ptsBurned: txType === "BURN" ? pointsBurned : undefined,
            cashPaid: txType === "BURN" ? Math.max(0, Number(totalCartAmount) - pointsBurned) : undefined,
            refId,
            timestamp: new Date().toLocaleTimeString("tr-TR")
          });

          setStats(s => ({ 
            ...s, 
            totalTxToday: s.totalTxToday + 1, 
            ptsGivenToday: s.ptsGivenToday + (txType === "EARN" ? ptsPreview : 0) 
          }));
          
          router.refresh();

          // Form ve inputları temizle
          setAmount("");
          setTotalCartAmount("");
          setCustomer(prev => prev ? { ...prev, pts: newTotal } : null);
          setTxType(null);
          setTxSuccess(true);
        }
      } catch {
        setTxError("İşlem sırasında beklenmedik bir hata oluştu.");
      }
    });
  }, [customer, txType, amount, totalCartAmount, ptsPreview, router]);

  // Invite Customer Form Actions
  const setInviteField = useCallback((field: keyof typeof inviteForm, value: string) => {
    setInviteForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetInviteForm = useCallback(() => {
    setInviteForm({ firstName: "", lastName: "", phone: "", email: "" });
  }, []);

  const isInviteEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email.trim());
  const isInviteFormValid =
    inviteForm.firstName.trim().length > 0 &&
    inviteForm.lastName.trim().length > 0 &&
    inviteForm.phone.trim().length >= 7 &&
    isInviteEmailValid;

  const handleInviteCustomer = useCallback(async () => {
    if (!isInviteFormValid || inviteSubmitting) return;
    setInviteSubmitting(true);
    setToastMessage(null);

    try {
      const res = await registerCustomerAction(
        `${inviteForm.firstName} ${inviteForm.lastName}`.trim(),
        inviteForm.phone.trim(),
        inviteForm.email.trim()
      );
      if ("error" in res && res.error) {
        setToastMessage({ text: res.error, type: "error" });
      } else if (res.success) {
        setToastMessage({ text: "Davetiye başarıyla e-posta adresine gönderildi.", type: "success" });
        setStats(s => ({ ...s, newMembersToday: s.newMembersToday + 1 }));
        resetInviteForm();
      }
    } catch {
      setToastMessage({ text: "Davetiye gönderilirken sistemsel bir hata oluştu.", type: "error" });
    } finally {
      setInviteSubmitting(false);
    }
  }, [inviteForm, isInviteFormValid, inviteSubmitting, resetInviteForm]);

  // Deprecated handleAddCustomer compatibility
  const handleAddCustomer = useCallback(async (data: { firstName: string; lastName: string; phone: string; email: string }) => {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          const res = await registerCustomerAction(
            `${data.firstName} ${data.lastName}`.trim(),
            data.phone,
            data.email
          );
          if ("error" in res && res.error) {
            setTxError(res.error);
            reject(new Error((res as { error: string }).error || "Kayıt hatası"));
            return;
          }
          if (res.success) {
            setTxError("Davetiye başarıyla e-posta adresine gönderildi.");
            setShowAddCustomer(false);
            setStats(s => ({ ...s, newMembersToday: s.newMembersToday + 1 }));
            resolve();
          }
        } catch (e) {
          setTxError("Müşteri eklenirken hata oluştu");
          reject(e);
        }
      });
    });
  }, []);

  const reset = useCallback(() => {
    setCustomer(null);
    setTxType(null);
    setAmount("");
    setTotalCartAmount("");
    setTxSuccess(false);
    setTxError("");
    setSearchError("");
    setLastTxReceipt(null);
  }, []);

  const clearTxReceipt = useCallback(() => {
    setLastTxReceipt(null);
  }, []);



  return {
    state: {
      customer,
      scanInput,
      scanning,
      txType,
      amount,
      totalCartAmount,
      txSuccess,
      txError,
      searchError,
      stats,
      showAddCustomer,
      branchStatus,
      ptsPreview,
      isPending,
      showSignOutOverlay,
      showAuditModal,
      auditTransactions,
      auditLoading,
      inviteForm,
      inviteSubmitting,
      isInviteEmailValid,
      isInviteFormValid,
      toastMessage,
      lastTxReceipt
    },
    actions: {
      setScanInput,
      setTxType,
      setAmount,
      setTotalCartAmount,
      setShowAddCustomer,
      setTxSuccess,
      setTxError,
      setSearchError,
      handleScan,
      handleTx,
      handleAddCustomer,
      reset,
      setShowSignOutOverlay,
      signOut,
      setShowAuditModal,
      fetchAuditTransactions,
      setInviteField,
      resetInviteForm,
      handleInviteCustomer,
      setToastMessage,
      clearTxReceipt
    }
  };
}

