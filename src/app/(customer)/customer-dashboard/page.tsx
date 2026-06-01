import { syncCustomerData } from "./actions";
import { CustomerDashboardClientPage } from "./client-page";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Müşteri Paneli | Sadakat Puan Sistemi",
  description: "Sadakat cüzdanınızı görüntüleyin, reaktif anti-fraud QR kodunuzu oluşturun ve işlem defterinizi canlı takip edin.",
};

export default async function CustomerDashboardPage() {
  const initialData = await syncCustomerData();

  return (
    <CustomerDashboardClientPage initialCustomerData={initialData} />
  );
}
