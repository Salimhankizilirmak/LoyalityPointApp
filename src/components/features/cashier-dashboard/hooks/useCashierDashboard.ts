"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { 
  searchCustomerAction, 
  earnPointsAction, 
  burnPointsAction, 
  registerCustomerAction, 
  getBranchStatus 
} from "@/app/(cashier)/cashier-dashboard/actions";

export interface CustomerData {
  id: string;
  name: string;
  phone: string;
  pts: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  totalTx: number;
  avatar: string;
}

export type TxType = "EARN" | "BURN" | null;

export function useCashierDashboard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [txType, setTxType] = useState<TxType>(null);
  const [amount, setAmount] = useState("");
  const [txSuccess, setTxSuccess] = useState(false);
  const [txError, setTxError] = useState("");
  const [stats, setStats] = useState({ totalTxToday: 0, ptsGivenToday: 0, newMembersToday: 0 });
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [branchStatus, setBranchStatus] = useState<{ isActive: boolean; isDeleted: boolean } | null>(null);
  const [showSignOutOverlay, setShowSignOutOverlay] = useState(false);
  const { signOut } = useClerk();

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
    
    checkStatus();
    const interval = setInterval(checkStatus, 180000); // 180s check (3 minutes)
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const baseAmount = Number(amount) || 0;
  const ptsPreview = (!amount || !txType) ? 0 : (
    txType === "EARN"
      ? Math.floor((baseAmount * 10) / 100)  // varsayılan %10 oran
      : Math.min(baseAmount, customer?.pts ?? 0)
  );

  const handleScan = useCallback(async (phone: string) => {
    if (!phone) return;
    setScanning(true);
    setTxError("");
    try {
      const result = await searchCustomerAction(phone);
      if ("error" in result) {
        setTxError(result.error ?? "Arama hatası");
      } else if (result.found && result.customer) {
        const c = result.customer;
        setCustomer({
          id: c.id,
          name: c.name,
          phone: c.phoneNumber,
          pts: c.totalPoints,
          tier: "Bronze",
          totalTx: 0,
          avatar: c.name?.[0] ?? "?",
        });
        setScanInput("");
      } else {
        setTxError("Müşteri bulunamadı");
      }
    } catch {
      setTxError("Sorgulama hatası");
    } finally {
      setScanning(false);
    }
  }, []);

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
          result = await burnPointsAction(customer.id, pointsToBurn);
        }

        if ("error" in result && result.error) {
          setTxError(result.error || "İşlem başarısız");
        } else if ("success" in result && result.success) {
          const newTotal = "newTotal" in result ? (result as { newTotal: number }).newTotal : customer.pts;
          setStats(s => ({ 
            ...s, 
            totalTxToday: s.totalTxToday + 1, 
            ptsGivenToday: s.ptsGivenToday + (txType === "EARN" ? ptsPreview : 0) 
          }));
          
          router.refresh();

          // Form ve inputları temizle
          setAmount("");
          setCustomer(prev => prev ? { ...prev, pts: newTotal } : null);
          setTxType(null);
          setTxSuccess(false);
        }
      } catch {
        setTxError("İşlem sırasında hata oluştu");
      }
    });
  }, [customer, txType, amount, ptsPreview, router]);

  const handleAddCustomer = useCallback(async (data: { firstName: string; lastName: string; phone: string }) => {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          const res = await registerCustomerAction(
            `${data.firstName} ${data.lastName}`.trim(),
            data.phone
          );
          if ("error" in res && res.error) {
            setTxError(res.error);
            reject(new Error((res as { error: string }).error || "Kayıt hatası"));
            return;
          }
          if (res.success && res.customer) {
            const c = res.customer;
            setCustomer({
              id: c.id,
              name: c.name,
              phone: c.phoneNumber,
              pts: c.totalPoints,
              tier: "Bronze",
              totalTx: 0,
              avatar: c.name?.[0] ?? "?",
            });
            setScanInput("");
            setShowAddCustomer(false);
          }
          setStats(s => ({ ...s, newMembersToday: s.newMembersToday + 1 }));
          resolve();
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
    setTxSuccess(false);
    setTxError("");
  }, []);

  return {
    state: {
      customer,
      scanInput,
      scanning,
      txType,
      amount,
      txSuccess,
      txError,
      stats,
      showAddCustomer,
      branchStatus,
      ptsPreview,
      isPending,
      showSignOutOverlay
    },
    actions: {
      setScanInput,
      setTxType,
      setAmount,
      setShowAddCustomer,
      setTxSuccess,
      setTxError,
      handleScan,
      handleTx,
      handleAddCustomer,
      reset,
      setShowSignOutOverlay,
      signOut
    }
  };
}
