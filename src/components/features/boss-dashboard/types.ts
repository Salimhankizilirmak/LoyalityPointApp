export interface Employee {
  id: string;
  name: string;
  email: string;
  role: "boss" | "manager" | "cashier";
  avatar: string;
  status: "active" | "pending";
  createdAt?: number;
}

export interface Branch {
  id: number | string;
  name: string;
  city: string;
  manager: string;
  transactions: number;
  earnedPts: number;
  spentPts: number;
  status: "active" | "passive";
}

export interface TopCustomer {
  rank: number;
  name: string;
  phone: string;
  earned: number;
  spent: number;
  level: string;
}

export interface BossInfo {
  name: string;
  email: string;
  orgName: string;
}
