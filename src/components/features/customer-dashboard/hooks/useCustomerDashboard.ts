"use client";

import { useState, useEffect, useMemo } from "react";
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
  createdAt: Date;
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

const ITEMS_PER_PAGE = 9;

export function useCustomerDashboard(initialCustomerData: CustomerData | null) {
  const [activeTab, setActiveTab] = useState<"cuzdan" | "islemler" | "profil">("cuzdan");
  const [customerData, setCustomerData] = useState<CustomerData | null>(initialCustomerData);
  const [ledgerTransactions, setLedgerTransactions] = useState<LedgerTransaction[]>([]);
  const [loading, setLoading] = useState(!initialCustomerData);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSignOutOverlay, setShowSignOutOverlay] = useState(false);

  // Sayfalama State'i
  const [currentPage, setCurrentPage] = useState(1);

  // Mock Veri State'i
  const [isMockData, setIsMockData] = useState(false);

  // Tema Yönetimi
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

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
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateNewToken();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sunucu Eylemleri ile Verileri Yükle
  const loadLedgerData = async () => {
    try {
      const res = await getCustomerLedgerTransactionsAction();
      if (res.success && res.transactions) {
        setLedgerTransactions(res.transactions as unknown as LedgerTransaction[]);
      }
    } catch (err) {
      console.error("Error loading ledger transactions:", err);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        if (!customerData) {
          const data = await syncCustomerData();
          if (data) setCustomerData(data as CustomerData);
        }
        await loadLedgerData();
      } catch (err) {
        console.error("Error loading customer dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // 30 saniyede bir canlı ledger verilerini güncelle
    const pollInterval = setInterval(loadLedgerData, 30000);
    return () => clearInterval(pollInterval);
  }, [customerData]);

  // Tema Geçiş Fonksiyonu
  const toggleTheme = () => {
    const nextTheme = isDarkMode ? "light" : "dark";
    setIsDarkMode(!isDarkMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", nextTheme);
      if (nextTheme === "dark") {
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

  // Mock Ledger Timeline Tanımı (Sayfalama testi için 12 kayıt)
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
      createdAt: new Date("2026-06-01T14:30:00"),
      branchName: "Nişantaşı Şubesi",
    },
    {
      id: "mock_tx_2",
      refId: null,
      type: "EARN",
      amountSpent: 150.00,
      pointsAmount: 15,
      totalCartAmount: 150.00,
      description: "150 TL tutarında puan kazanma alışverişi.",
      status: "SUCCESS",
      createdAtFormatted: "28.05.2026 18:15",
      createdAt: new Date("2026-05-28T18:15:00"),
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
      createdAt: new Date("2026-05-25T12:00:00"),
      branchName: "Kadıköy Şubesi",
    },
    {
      id: "mock_tx_4",
      refId: "REF-ABC123",
      type: "SPLIT_PAYMENT",
      amountSpent: 80.00,
      pointsAmount: -200,
      totalCartAmount: 280.00,
      description: "REF-ABC123 referanslı parçalı ödeme.",
      status: "SUCCESS",
      createdAtFormatted: "20.05.2026 09:45",
      createdAt: new Date("2026-05-20T09:45:00"),
      branchName: "Etiler Şubesi",
    },
    {
      id: "mock_tx_5",
      refId: null,
      type: "EARN",
      amountSpent: 320.00,
      pointsAmount: 32,
      totalCartAmount: 320.00,
      description: "320 TL tutarında puan kazanma alışverişi.",
      status: "SUCCESS",
      createdAtFormatted: "18.05.2026 16:00",
      createdAt: new Date("2026-05-18T16:00:00"),
      branchName: "Levent Şubesi",
    },
    {
      id: "mock_tx_6",
      refId: null,
      type: "BURN",
      amountSpent: 0,
      pointsAmount: -50,
      totalCartAmount: 50.00,
      description: "50 puan harcama işlemi.",
      status: "SUCCESS",
      createdAtFormatted: "15.05.2026 11:30",
      createdAt: new Date("2026-05-15T11:30:00"),
      branchName: "Ataşehir Şubesi",
    },
    {
      id: "mock_tx_7",
      refId: "REF-DEF456",
      type: "SPLIT_PAYMENT",
      amountSpent: 200.00,
      pointsAmount: -300,
      totalCartAmount: 500.00,
      description: "REF-DEF456 referanslı parçalı ödeme.",
      status: "SUCCESS",
      createdAtFormatted: "12.05.2026 14:15",
      createdAt: new Date("2026-05-12T14:15:00"),
      branchName: "Bağdat Caddesi Şubesi",
    },
    {
      id: "mock_tx_8",
      refId: null,
      type: "EARN",
      amountSpent: 75.00,
      pointsAmount: 8,
      totalCartAmount: 75.00,
      description: "75 TL tutarında puan kazanma.",
      status: "SUCCESS",
      createdAtFormatted: "10.05.2026 10:00",
      createdAt: new Date("2026-05-10T10:00:00"),
      branchName: "Taksim Şubesi",
    },
    {
      id: "mock_tx_9",
      refId: "REF-GHI789",
      type: "SPLIT_PAYMENT",
      amountSpent: 120.00,
      pointsAmount: -180,
      totalCartAmount: 300.00,
      description: "REF-GHI789 referanslı parçalı ödeme.",
      status: "VOIDED",
      createdAtFormatted: "08.05.2026 17:45",
      createdAt: new Date("2026-05-08T17:45:00"),
      branchName: "Beyoğlu Şubesi",
    },
    {
      id: "mock_tx_10",
      refId: null,
      type: "EARN",
      amountSpent: 500.00,
      pointsAmount: 50,
      totalCartAmount: 500.00,
      description: "500 TL tutarında puan kazanma.",
      status: "SUCCESS",
      createdAtFormatted: "05.05.2026 13:20",
      createdAt: new Date("2026-05-05T13:20:00"),
      branchName: "Şişli Şubesi",
    },
    {
      id: "mock_tx_11",
      refId: null,
      type: "BURN",
      amountSpent: 0,
      pointsAmount: -100,
      totalCartAmount: 100.00,
      description: "100 puan harcama işlemi.",
      status: "SUCCESS",
      createdAtFormatted: "02.05.2026 08:00",
      createdAt: new Date("2026-05-02T08:00:00"),
      branchName: "Maslak Şubesi",
    },
    {
      id: "mock_tx_12",
      refId: "REF-JKL012",
      type: "SPLIT_PAYMENT",
      amountSpent: 250.00,
      pointsAmount: -500,
      totalCartAmount: 750.00,
      description: "REF-JKL012 referanslı parçalı ödeme.",
      status: "SUCCESS",
      createdAtFormatted: "28.04.2026 19:00",
      createdAt: new Date("2026-04-28T19:00:00"),
      branchName: "Florya Şubesi",
    },
  ];

  // Aktif Veri Seçimi (Mock vs Gerçek)
  const activeCustomerData = isMockData ? mockCustomerData : customerData;
  const activeLedgerTransactions = isMockData ? mockLedgerTransactions : ledgerTransactions;
  const pts = activeCustomerData ? Math.floor(activeCustomerData.currentPoints / 100) : 450;

  // Sayfalama Hesaplaması
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(activeLedgerTransactions.length / ITEMS_PER_PAGE)),
    [activeLedgerTransactions.length]
  );

  const paginatedTransactions = useMemo(
    () => activeLedgerTransactions.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    ),
    [activeLedgerTransactions, currentPage]
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Sekme değiştiğinde sayfayı sıfırla (useEffect yerine wrapper)
  const handleTabChange = (tab: "cuzdan" | "islemler" | "profil") => {
    setActiveTab(tab);
    setCurrentPage(1);
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
      setActiveTab: handleTabChange,
      setShowProfileModal,
      setShowSignOutOverlay,
      signOut,
      setCustomerData,
      refreshLedger: loadLedgerData,
      setIsMockData,
      toggleTheme,
      goToPage
    }
  };
}


