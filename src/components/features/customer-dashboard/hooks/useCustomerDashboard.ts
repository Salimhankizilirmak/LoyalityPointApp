"use client";

import { useState, useEffect, useRef } from "react";
import { useClerk, useUser, useOrganization } from "@clerk/nextjs";
import { syncCustomerData, getCustomerLedgerTransactionsAction } from "@/app/(customer)/customer-dashboard/actions";


export interface LedgerTransaction {
  id: string;
  refId: string | null;
  type: "EARN" | "BURN" | "VOID" | "CASH_SETTLEMENT" | "SPLIT_PAYMENT";
  amountSpent: number; // TL
  pointsAmount: number;
  totalCartAmount: number; // TL
  description: string;
  status: "SUCCESS" | "VOIDED";
  createdAtFormatted: string;
  createdAt: string;
  branchName: string;
}

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

export function useCustomerDashboard(
  initialCustomerData: CustomerData | null,
  initialLedgerTransactions?: LedgerTransaction[]
) {
  const [activeTab, setActiveTab] = useState<"cuzdan" | "islemler" | "profil" | "kampanyalar">("cuzdan");
  const [customerData, setCustomerData] = useState<CustomerData | null>(initialCustomerData);
  const [ledgerTransactions, setLedgerTransactions] = useState<LedgerTransaction[]>(initialLedgerTransactions || []);
  const [loading, setLoading] = useState(!(initialCustomerData && initialLedgerTransactions));
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSignOutOverlay, setShowSignOutOverlay] = useState(false);

  const isCancelled = useRef(false);
  const pollIntervalRef = useRef<any>(null);
  const qrIntervalRef = useRef<any>(null);

  // Sayfalama State'i
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6; // Üçlü grid için 6 kart

  // Tema Yönetimi
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme) {
        return storedTheme === "dark";
      }
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
      }
    }
  }, [isDarkMode]);

  // Anti-Fraud QR State
  const [qrToken, setQrToken] = useState(() => {
    const randomPart = Math.random().toString(36).substring(2, 15).toUpperCase();
    return `ANTIFRAUD-QR-${randomPart}`;
  });
  const [timeLeft, setTimeLeft] = useState(60);

  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const { organization } = useOrganization();

  // QR Token Generator
  const generateNewToken = () => {
    const randomPart = Math.random().toString(36).substring(2, 15).toUpperCase();
    setQrToken(`ANTIFRAUD-QR-${randomPart}`);
  };

  // 60 Saniye Geri Sayım ve Token Yenileme Motoru
  useEffect(() => {
    const interval = setInterval(() => {
      if (isCancelled.current) return;
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateNewToken();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    qrIntervalRef.current = interval;
    return () => {
      clearInterval(interval);
      qrIntervalRef.current = null;
    };
  }, []);

  // Sunucu Eylemleri ile Verileri Yükle
  const loadLedgerData = async () => {
    if (isCancelled.current) return;
    try {
      const res = await getCustomerLedgerTransactionsAction();
      if (isCancelled.current) return;
      if (res.success && res.transactions) {
        setLedgerTransactions(res.transactions as unknown as LedgerTransaction[]);
      }
    } catch (err) {
      if (isCancelled.current) return;
      
      // Oturum kapanırken Next.js redirect dönerse bu hatayı sessizce yut
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("unexpected response")) return;
      
      console.error("Error loading ledger transactions:", err);
    }
  };

  const hasInitialData = !!(initialCustomerData && initialLedgerTransactions);
  const isFirstMount = useRef(true);

  useEffect(() => {
    async function loadData() {
      if (isCancelled.current) return;
      try {
        if (!customerData) {
          const data = await syncCustomerData();
          if (isCancelled.current) return;
          if (data) setCustomerData(data as CustomerData);
        }
        await loadLedgerData();
      } catch (err) {
        if (isCancelled.current) return;
        
        // Oturum kapanırken Next.js redirect dönerse bu hatayı sessizce yut
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes("unexpected response")) return;
        
        console.error("Error loading customer dashboard data:", err);
      } finally {
        if (!isCancelled.current) {
          setLoading(false);
        }
      }
    }

    if (hasInitialData && isFirstMount.current) {
      isFirstMount.current = false;
      setLoading(false);
    } else {
      loadData();
    }

    // 30 saniyede bir canlı ledger verilerini güncelle
    const pollInterval = setInterval(loadLedgerData, 30000);
    pollIntervalRef.current = pollInterval;
    return () => {
      clearInterval(pollInterval);
      pollIntervalRef.current = null;
    };
  }, [customerData, hasInitialData]);

  // Tema Geçiş Fonksiyonu
  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", nextTheme ? "dark" : "light");
      if (nextTheme) {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
      }
    }
  };


  // Aktif Veri Seçimi
  const activeCustomerData = customerData;
  const activeLedgerTransactions = ledgerTransactions;
  const pts = activeCustomerData ? Math.floor(activeCustomerData.currentPoints / 100) : 0;

  // Sayfalama Hesaplaması
  const totalPages = Math.ceil(activeLedgerTransactions.length / pageSize) || 1;
  const paginatedTransactions = activeLedgerTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSetActiveTab = (tab: "cuzdan" | "islemler" | "profil" | "kampanyalar") => {
    setActiveTab(tab);
    setCurrentPage(1); // Sekme değiştiğinde sayfa 1'e sıfırlanır
  };

  const handleSetShowSignOutOverlay = (show: boolean) => {
    setShowSignOutOverlay(show);
    if (show) {
      isCancelled.current = true;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (qrIntervalRef.current) {
        clearInterval(qrIntervalRef.current);
        qrIntervalRef.current = null;
      }
    }
  };

  return {
    state: {
      activeTab,
      customerData: activeCustomerData,
      ledgerTransactions: activeLedgerTransactions,
      paginatedTransactions,
      currentPage,
      totalPages,
      loading,
      showProfileModal,
      showSignOutOverlay,
      pts,
      user,
      isLoaded,
      organization,
      qrToken,
      timeLeft,
      isDarkMode
    },
    actions: {
      setActiveTab: handleSetActiveTab,
      setCurrentPage,
      setShowProfileModal,
      setShowSignOutOverlay: handleSetShowSignOutOverlay,
      signOut,
      setCustomerData,
      refreshLedger: loadLedgerData,
      toggleTheme
    }
  };
}


