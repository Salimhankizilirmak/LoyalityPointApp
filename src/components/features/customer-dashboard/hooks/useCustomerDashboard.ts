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

export function useCustomerDashboard(initialCustomerData: CustomerData | null) {
  const [activeTab, setActiveTab] = useState<"cuzdan" | "islemler" | "profil">("cuzdan");
  const [customerData, setCustomerData] = useState<CustomerData | null>(initialCustomerData);
  const [ledgerTransactions, setLedgerTransactions] = useState<LedgerTransaction[]>([]);
  const [loading, setLoading] = useState(!initialCustomerData);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSignOutOverlay, setShowSignOutOverlay] = useState(false);

  const isCancelled = useRef(false);
  const pollIntervalRef = useRef<any>(null);
  const qrIntervalRef = useRef<any>(null);

  // Sayfalama State'i
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6; // Üçlü grid için 6 kart

  // Mock Veri State'i
  const [isMockData, setIsMockData] = useState(false);

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
    loadData();
    // 30 saniyede bir canlı ledger verilerini güncelle
    const pollInterval = setInterval(loadLedgerData, 30000);
    pollIntervalRef.current = pollInterval;
    return () => {
      clearInterval(pollInterval);
      pollIntervalRef.current = null;
    };
  }, [customerData]);

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

  // Mock Müşteri Verisi Tanımı
  const mockCustomerData: CustomerData = {
    id: "mock_cust_123",
    clerkId: "mock_clerk_123",
    firstName: "Alperen",
    lastName: "Songüt",
    email: "alperen@mockcustomer.com",
    phone: "+905554443322",
    currentPoints: 45000, // 450.00 TL puan
  };

  // Mock Ledger Timeline Tanımı
  const mockLedgerTransactions: LedgerTransaction[] = [
    {
      id: "mock_tx_1",
      refId: "REF-XYZ987",
      type: "SPLIT_PAYMENT",
      amountSpent: 50.00,
      pointsAmount: -450,
      totalCartAmount: 500.00,
      description: "REF-XYZ987 nolu 500 TL tutarındaki alışveriş.",
      status: "SUCCESS",
      createdAtFormatted: "01.06.2026 14:30",
      createdAt: new Date("2026-06-01T14:30:00").toISOString(),
      branchName: "Nişantaşı Şubesi",
    },
    {
      id: "mock_tx_2",
      refId: "REF-ABC123",
      type: "EARN",
      amountSpent: 150.00,
      pointsAmount: 15,
      totalCartAmount: 150.00,
      description: "150 TL tutarında puan kazanma alışverişi.",
      status: "SUCCESS",
      createdAtFormatted: "28.05.2026 18:15",
      createdAt: new Date("2026-05-28T18:15:00").toISOString(),
      branchName: "Beşiktaş Şubesi",
    },
    {
      id: "mock_tx_3",
      refId: "REF-VOID45",
      type: "SPLIT_PAYMENT",
      amountSpent: 100.00,
      pointsAmount: -100,
      totalCartAmount: 200.00,
      description: "REF-VOID45 nolu alışveriş iptal edilmiştir.",
      status: "VOIDED",
      createdAtFormatted: "25.05.2026 12:00",
      createdAt: new Date("2026-05-25T12:00:00").toISOString(),
      branchName: "Kadıköy Şubesi",
    },
    {
      id: "mock_tx_4",
      refId: "REF-KRT555",
      type: "EARN",
      amountSpent: 300.00,
      pointsAmount: 30,
      totalCartAmount: 300.00,
      description: "Puan kazanımı.",
      status: "SUCCESS",
      createdAtFormatted: "24.05.2026 15:45",
      createdAt: new Date("2026-05-24T15:45:00").toISOString(),
      branchName: "Ataşehir Şubesi",
    },
    {
      id: "mock_tx_5",
      refId: "REF-BRN111",
      type: "BURN",
      amountSpent: 0.00,
      pointsAmount: -200,
      totalCartAmount: 200.00,
      description: "Puan harcama.",
      status: "SUCCESS",
      createdAtFormatted: "22.05.2026 09:30",
      createdAt: new Date("2026-05-22T09:30:00").toISOString(),
      branchName: "Caddebostan Şubesi",
    },
    {
      id: "mock_tx_6",
      refId: "REF-XYZ111",
      type: "SPLIT_PAYMENT",
      amountSpent: 120.00,
      pointsAmount: -80,
      totalCartAmount: 200.00,
      description: "Parçalı Ödeme.",
      status: "SUCCESS",
      createdAtFormatted: "20.05.2026 19:10",
      createdAt: new Date("2026-05-20T19:10:00").toISOString(),
      branchName: "Bebek Şubesi",
    },
    {
      id: "mock_tx_7",
      refId: "REF-XYZ222",
      type: "EARN",
      amountSpent: 80.00,
      pointsAmount: 8,
      totalCartAmount: 80.00,
      description: "Puan kazanımı.",
      status: "SUCCESS",
      createdAtFormatted: "18.05.2026 11:20",
      createdAt: new Date("2026-05-18T11:20:00").toISOString(),
      branchName: "Göztepe Şubesi",
    }
  ];

  // Aktif Veri Seçimi (Mock vs Gerçek)
  const activeCustomerData = isMockData ? mockCustomerData : customerData;
  const activeLedgerTransactions = isMockData ? mockLedgerTransactions : ledgerTransactions;
  const pts = activeCustomerData ? Math.floor(activeCustomerData.currentPoints / 100) : 450;

  // Sayfalama Hesaplaması
  const totalPages = Math.ceil(activeLedgerTransactions.length / pageSize) || 1;
  const paginatedTransactions = activeLedgerTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSetActiveTab = (tab: "cuzdan" | "islemler" | "profil") => {
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
      isMockData,
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
      setIsMockData,
      toggleTheme
    }
  };
}


