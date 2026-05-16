export interface Transaction {
  id: number | string;
  customer: string;
  type: "earned" | "spent" | "new";
  pts: number;
  amount: number;
  cashier: string;
  time: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  currentPoints: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: "boss" | "manager" | "cashier";
  avatar: string;
  status: "active" | "pending";
  txCount?: number;
  newReg?: number;
}
