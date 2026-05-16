export interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string;
  branches: number;
  created: string;
  status: "active" | "inactive";
  customers: number;
  txVolume: number;
  managerCount?: number;
}

export interface ActivityLogItem {
  id: number;
  type: "success" | "warn" | "error" | "info";
  msg: string;
  time: string;
  actor: string;
}
export interface InvitedBoss {
  id: string;
  email: string;
  status: "pending" | "accepted";
  createdAt: number;
  lastSignIn?: number | null;
}
