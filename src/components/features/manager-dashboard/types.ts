export interface Transaction {
  id: number | string;
  customer: string;
  type: "earned" | "spent" | "new" | "void";
  pts: number;
  amount: number;
  cashier: string;
  time: string;
  status?: string;
  parentTransactionId?: string | null;
}

export type ActivityType =
  | "earned"            // Puan kazandı
  | "spent"             // Puan harcadı
  | "cashier_invited"   // Kasiyer davet edildi
  | "cashier_accepted"  // Kasiyer daveti kabul etti
  | "customer_invited"  // Müşteri davet edildi
  | "customer_accepted" // Müşteri daveti kabul etti
  | "void"              // İşlem iptali
  | "system";           // Sistem bildirimleri (örn: kampanya güncellemeleri)

export interface ActivityItem {
  id: string;
  type: ActivityType;
  actorName: string;     // Kasiyer adı (puan işlemleri) veya davet edilen kişi adı
  targetName?: string;   // Müşteri adı (earned/spent için)
  pts?: number;
  amount?: number;
  time: string;
  rawTime: number;       // Unix ms — sıralama için
  status?: string;
  originalTx?: Transaction; // Düzenleme butonu için
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  currentPoints: number;
  status?: "active" | "pending";
  createdAt?: string | Date | number | null;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: "boss" | "manager" | "cashier";
  avatar: string;
  status: "active" | "pending" | "suspended";
  createdAt?: string | Date | number | null;
  acceptedAt?: string | Date | number | null;
  invitedCustomerCount?: number;
  txCount?: number;
  newReg?: number;
  pointsEarned?: number;
  pointsSpent?: number;
  dailyAmount?: number;
}

