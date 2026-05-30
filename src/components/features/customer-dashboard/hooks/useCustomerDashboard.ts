"use client";

import { useState, useEffect } from "react";
import { useClerk, useUser, useOrganization } from "@clerk/nextjs";
import { syncCustomerData, getCustomerTransactions } from "@/app/(customer)/customer-dashboard/actions";

export interface Transaction {
  id: string;
  amount: number;
  transactionType: string;
  createdAt: Date | null;
  description?: string;
}

export interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentPoints: number;
  id: string;
  clerkId: string;
}

export const TIER_INFO = {
  Bronze: { min: 0, max: 2000, color: "#b45309", bg: "#fef3c7", next: "Silver", ptsNeeded: 2000 },
  Silver: { min: 2000, max: 5000, color: "#475569", bg: "#f1f5f9", next: "Gold", ptsNeeded: 5000 },
  Gold: { min: 5000, max: 10000, color: "#a16207", bg: "#fef9c3", next: "Platinum", ptsNeeded: 10000 },
  Platinum: { min: 10000, max: 10000, color: "#0891b2", bg: "#ecfeff", next: "Platinum", ptsNeeded: 99999 },
};

export function useCustomerDashboard() {
  const [activeTab, setActiveTab] = useState<"puan" | "gecmis" | "teklifler" | "profil">("puan");
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignOutOverlay, setShowSignOutOverlay] = useState(false);

  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const { organization } = useOrganization();

  useEffect(() => {
    async function loadData() {
      try {
        const [data, txs] = await Promise.all([
          syncCustomerData(),
          getCustomerTransactions()
        ]);
        if (data) {
          setCustomerData(data);
        }
        setTransactions(txs as Transaction[]);
      } catch (err) {
        console.error("Error loading customer data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const pts = customerData ? Math.floor(customerData.currentPoints / 100) : 0;
  
  // Seviye hesabı
  let tier: keyof typeof TIER_INFO = "Bronze";
  if (pts >= 10000) tier = "Platinum";
  else if (pts >= 5000) tier = "Gold";
  else if (pts >= 2000) tier = "Silver";

  const ti = TIER_INFO[tier];
  const progress = Math.min(((pts - ti.min) / (ti.max - ti.min)) * 100, 100);

  return {
    state: {
      activeTab,
      customerData,
      transactions,
      loading,
      showSignOutOverlay,
      pts,
      tier,
      ti,
      progress,
      user,
      isLoaded,
      organization
    },
    actions: {
      setActiveTab,
      setShowSignOutOverlay,
      signOut,
      setCustomerData,
      setTransactions
    }
  };
}
