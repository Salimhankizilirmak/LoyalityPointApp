"use client";

import { useCustomerDashboard } from "@/components/features/customer-dashboard/hooks/useCustomerDashboard";
import { DashboardLoadingScreen } from "@/components/dashboard/DashboardLoadingScreen";
import { ProfileSettingsModal } from "@/components/features/profile-settings/ui/ProfileSettingsModal";
import { CustomerDashboardModals } from "@/components/features/customer-dashboard/modals/CustomerDashboardModals";
import { SidebarNavigation } from "@/components/features/customer-dashboard/ui/SidebarNavigation";
import { DigitalWalletCard } from "@/components/features/customer-dashboard/ui/DigitalWalletCard";
import { AntiFraudQR } from "@/components/features/customer-dashboard/ui/AntiFraudQR";
import { LiveLedgerTimeline } from "@/components/features/customer-dashboard/ui/LiveLedgerTimeline";

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
}

export function CustomerDashboardClientPage({
  initialCustomerData,
}: CustomerDashboardClientPageProps) {
  const { state, actions } = useCustomerDashboard(initialCustomerData);
  
  const { 
    activeTab, 
    customerData, 
    ledgerTransactions, 
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
    isMockData,
    isDarkMode
  } = state;

  const { 
    setActiveTab, 
    setCurrentPage,
    setShowProfileModal, 
    setShowSignOutOverlay,
    signOut,
    setIsMockData,
    toggleTheme
  } = actions;

  if (loading || !isLoaded) {
    const displayName = user 
      ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.emailAddresses?.[0]?.emailAddress?.split("@")[0] || null)) 
      : (initialCustomerData ? `${initialCustomerData.firstName} ${initialCustomerData.lastName}` : null);
    return (
      <DashboardLoadingScreen
        userName={displayName}
        orgName={organization?.name || "Sadakat Paneli"}
        logoUrl={organization?.imageUrl || null}
      />
    );
  }

  // Kullanıcı Bilgileri
  const userFullName = user?.fullName || (customerData ? `${customerData.firstName} ${customerData.lastName}` : "Sadakat Üyesi");
  const userEmail = user?.primaryEmailAddress?.emailAddress || customerData?.email || "";
  const userAvatar = user?.imageUrl || "";

  return (
    <div className="flex-1 flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Profil Ayarları Modalı */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        isDarkMode={true}
      />

      {/* Ortak Modaller ve Çıkış Overlay'i */}
      <CustomerDashboardModals state={state} actions={actions} />

      {/* MASAÜSTÜ SOL DİKEY MENÜ */}
      <SidebarNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userFullName={userFullName}
        userEmail={userEmail}
        userAvatar={userAvatar}
        isMockData={isMockData}
        setIsMockData={setIsMockData}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        signOut={async () => setShowSignOutOverlay(true)}
        setShowProfileModal={setShowProfileModal}
      />

      {/* ANA İÇERİK ALANI */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6 relative overflow-x-hidden">
        {/* Ambient Neon Parlamalar */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-b from-cyan-500/5 via-indigo-500/0 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-gradient-to-t from-indigo-500/5 via-cyan-500/0 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* SEKMELİ SAYFA GÖVDESİ */}
        <div className="flex-1 px-5 md:px-8 py-6 relative z-10 max-w-7xl w-full mx-auto">
          {/* Cüzdan Görünümü */}
          {activeTab === "cuzdan" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch gap-6">
              {/* Sol Sütun: Cüzdan Kartı & Canlı QR */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <DigitalWalletCard pts={pts} />
                <AntiFraudQR />
              </div>
              {/* Sağ Sütun: Defter Akışı */}
              <div className="hidden md:block lg:col-span-7">
                <LiveLedgerTimeline
                  activeTab={activeTab}
                  ledgerTransactions={ledgerTransactions}
                  paginatedTransactions={paginatedTransactions}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                />
              </div>
            </div>
          )}

          {/* İşlem Geçmişi Görünümü */}
          {activeTab === "islemler" && (
            <LiveLedgerTimeline
              activeTab={activeTab}
              ledgerTransactions={ledgerTransactions}
              paginatedTransactions={paginatedTransactions}
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          )}
        </div>

      </main>
    </div>
  );
}

export default CustomerDashboardClientPage;
