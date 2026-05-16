import { Branch, TopCustomer } from "@/components/features/boss-dashboard/types";
import { Customer } from "@/components/features/manager-dashboard/types";
import { Organization, ActivityLogItem } from "@/components/features/super-admin/types";

export const ENABLE_MOCK_DATA = process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true";

export const MOCK_BRANCHES: Branch[] = [
  { id: 1, name: "İstanbul Cevahir AVM", city: "İstanbul", manager: "Selin Öztürk", transactions: 4820, earnedPts: 148200, spentPts: 62400, status: "active" },
  { id: 2, name: "Ankara Ankamall", city: "Ankara", manager: "Kemal Arslan", transactions: 3210, earnedPts: 97800, spentPts: 41200, status: "active" },
  { id: 3, name: "İzmir Forum AVM", city: "İzmir", manager: "Deniz Kara", transactions: 2940, earnedPts: 88500, spentPts: 37900, status: "active" },
];

export const MOCK_TOP_CUSTOMERS: TopCustomer[] = [
  { rank: 1, name: "Fatma Güler", phone: "0532 *** **11", earned: 18420, spent: 9200, level: "Platinum" },
  { rank: 2, name: "Mehmet Koç", phone: "0541 *** **72", earned: 14880, spent: 7400, level: "Gold" },
  { rank: 3, name: "Zeynep Aydın", phone: "0555 *** **43", earned: 12310, spent: 5100, level: "Gold" },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: "c1", firstName: "Fatma", lastName: "Güler", phone: "0532 111 22 33", email: "fatma@ornek.com", currentPoints: 4820 },
  { id: "c2", firstName: "Mehmet", lastName: "Koç", phone: "0541 222 33 44", email: "mehmet@ornek.com", currentPoints: 2140 },
  { id: "c3", firstName: "Zeynep", lastName: "Aydın", phone: "0555 333 44 55", email: "zeynep@ornek.com", currentPoints: 6310 },
];

export const MOCK_ORGS: Organization[] = [
  { id: "mock-1", name: "Migros Ticaret A.Ş.", slug: "migros", email: "cto@migros.com.tr", branches: 312, created: "2023-03-12", status: "active", customers: 148200, txVolume: 4820000 },
  { id: "mock-2", name: "CarrefourSA", slug: "carrefoursa", email: "admin@carrefour.com.tr", branches: 87, created: "2023-07-01", status: "active", customers: 62400, txVolume: 1940000 },
];

export const INITIAL_LOGS: ActivityLogItem[] = [
  { id: 1, type: "success", msg: "Yeni Patron davet edildi", time: "14:32:01", actor: "super-admin" },
  { id: 2, type: "warn", msg: "Sistem heartbeat kontrolü geçti", time: "14:29:47", actor: "health-checker" },
];
