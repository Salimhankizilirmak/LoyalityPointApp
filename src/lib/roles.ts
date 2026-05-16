/**
 * 🔐 Loyalty Point App - Merkezi Rol Tanımları
 * 
 * Sistemdeki 5 temel rolün hiyerarşisi ve tanımları.
 */

export type UserRole = "admin" | "boss" | "manager" | "cashier" | "customer";

export const ROLE_HIERARCHY: Record<UserRole, { label: string; canInvite: UserRole[] }> = {
  admin: {
    label: "Süper Admin",
    canInvite: ["boss"]
  },
  boss: {
    label: "Patron / Organizasyon Sahibi",
    canInvite: ["manager"]
  },
  manager: {
    label: "Şube Yöneticisi",
    canInvite: ["cashier"]
  },
  cashier: {
    label: "Kasiyer",
    canInvite: [] // Kasiyer sadece müşteri kaydı yapar (davet değil)
  },
  customer: {
    label: "Müşteri",
    canInvite: []
  }
};

export const FORBIDDEN_EMAILS = [
  "admin@system.com",
  "root@system.com",
  "support@system.com"
];
