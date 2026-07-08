"use client";

import { useCustomerDashboard } from "@/components/features/customer-dashboard/hooks/useCustomerDashboard";
import { CustomerDashboardModals } from "@/components/features/customer-dashboard/modals/CustomerDashboardModals";
import { UniversalSidebar } from "@/components/ui/UniversalSidebar";
import { DigitalWalletCard } from "@/components/features/customer-dashboard/ui/DigitalWalletCard";
import { AntiFraudQR } from "@/components/features/customer-dashboard/ui/AntiFraudQR";
import { LiveLedgerTimeline } from "@/components/features/customer-dashboard/ui/LiveLedgerTimeline";
import { CustomerCampaignsView } from "@/components/features/customer-dashboard/ui/CustomerCampaignsView";
import { Wallet, History, Megaphone } from "lucide-react";

interface CustomerDashboardClientPageProps {
  initialCustomerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    currentPoints: number;
    id: string;
    clerkId: string;
  } | null;
  initialLedgerTransactions?: any[];
}

export function CustomerDashboardClientPage({
  initialCustomerData,
  initialLedgerTransactions,
}: CustomerDashboardClientPageProps) {
  const { state, actions } = useCustomerDashboard(initialCustomerData, initialLedgerTransactions);
  
  const { 
    activeTab, 
    customerData, 
    ledgerTransactions, 
    paginatedTransactions,
    currentPage,
    totalPages,
    pts, 
    user, 
  } = state;

  const { 
    setActiveTab, 
    setCurrentPage,
  } = actions;

  // Kullanıcı Bilgileri
  const userFullName = user?.fullName || (customerData ? `${customerData.firstName} ${customerData.lastName}` : "Sadakat Üyesi");

  return (
    <div className="flex-1 flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">

      {/* Ortak Modaller ve Çıkış Overlay'i */}
      <CustomerDashboardModals state={state} actions={actions} />

      {/* MASAÜSTÜ SOL DİKEY MENÜ */}
      <UniversalSidebar
        title={userFullName}
        navItems={[
          {
            name: "Cüzdanım",
            icon: Wallet,
            isActive: activeTab === "cuzdan" || !activeTab, // fallback
            onClick: () => setActiveTab("cuzdan")
          },
          {
            name: "Kampanyalar",
            icon: Megaphone,
            isActive: activeTab === "kampanyalar",
            onClick: () => setActiveTab("kampanyalar")
          },
          {
            name: "İşlem Geçmişi",
            icon: History,
            isActive: activeTab === "islemler",
            onClick: () => setActiveTab("islemler")
          }
        ]}
      />

      {/* ANA İÇERİK ALANI */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6 relative overflow-x-hidden">
        {/* Ambient Neon Parlamalar */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-b from-cyan-500/5 via-indigo-500/0 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-gradient-to-t from-indigo-500/5 via-cyan-500/0 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* SEKMELİ SAYFA GÖVDESİ */}
        <div className="flex-1 px-5 md:px-8 py-6 relative z-10 max-w-7xl w-full mx-auto">
          
          {/* Cüzdan Görünümü (Yan yana Grid yapısı) */}
          {(activeTab === "cuzdan" || !activeTab) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto mt-4 md:mt-12">
              <div className="flex justify-center md:justify-end">
                <div className="w-full max-w-md">
                   <DigitalWalletCard pts={pts} />
                </div>
              </div>
              <div className="flex justify-center md:justify-start">
                 <div className="w-full max-w-md">
                   <AntiFraudQR />
                 </div>
              </div>
            </div>
          )}

          {/* Kampanyalar Görünümü */}
          {activeTab === "kampanyalar" && (
            <CustomerCampaignsView />
          )}

          {/* İşlem Geçmişi Görünümü */}
          {activeTab === "islemler" && (
            <div className="max-w-4xl mx-auto">
              <LiveLedgerTimeline
                activeTab={activeTab}
                ledgerTransactions={ledgerTransactions}
                paginatedTransactions={paginatedTransactions}
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
              />
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default CustomerDashboardClientPage;
