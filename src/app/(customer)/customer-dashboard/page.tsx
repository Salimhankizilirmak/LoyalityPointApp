import { syncCustomerData, getCustomerLedgerTransactionsAction } from "./actions";
import { CustomerDashboardClientPage } from "./client-page";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Müşteri Paneli | Sadakat Puan Sistemi",
  description: "Sadakat cüzdanınızı görüntüleyin, reaktif anti-fraud QR kodunuzu oluşturun ve işlem defterinizi canlı takip edin.",
};

async function safeFetch<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    console.error("[CustomerDashboard Server Sync Error]:", error);
    return null;
  }
}

export default async function CustomerDashboardPage() {
  const [profile, ledgerTxs] = await Promise.all([
    safeFetch(syncCustomerData()),
    safeFetch(getCustomerLedgerTransactionsAction())
  ]);

  return (
    <CustomerDashboardClientPage 
      initialCustomerData={profile} 
      initialLedgerTransactions={ledgerTxs?.success ? ledgerTxs.transactions : []}
    />
  );
}
