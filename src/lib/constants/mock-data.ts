import { Branch, TopCustomer } from "@/components/features/boss-dashboard/types";
import { Customer } from "@/components/features/manager-dashboard/types";
import { Organization, ActivityLogItem } from "@/components/features/super-admin/types";
import { RecentTxRow } from "@/components/features/cashier-dashboard/ui/RecentTransactions";
import { Transaction } from "@/app/(cashier)/cashier-dashboard/transactions/transactions-client";
import { CustomerData, LedgerTransaction } from "@/components/features/customer-dashboard/hooks/useCustomerDashboard";
import { CustomerData as CashierCustomerData, TransactionData } from "@/components/features/cashier-dashboard/hooks/useCashierDashboard";

export const ENABLE_MOCK_DATA = process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true";

// ─── 1. MOCK_BRANCHES ────────────────────────────────────────────────────────
const generateMockBranches = (): Branch[] => {
  const cities = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep", "Eskişehir", "Trabzon", "Samsun", "Mersin", "Diyarbakır", "Kayseri", "Erzurum"];
  const managers = ["Selin Öztürk", "Kemal Arslan", "Deniz Kara", "Pınar Erdem", "Ali Can", "Seda Yılmaz", "Murat Kaya", "Elif Demir", "Ozan Şahin", "Gizem Polat", "Burcu Aksoy", "Tolga Erkan", "Aylin Taş", "Emir Can", "Derya Kurt", "Berkay Özdemir", "Rabia Güneş", "Fatih Çelik", "Sinem Doğan", "Umut Aydın"];
  
  const list: Branch[] = [
    { id: 1, name: "İstanbul Cevahir AVM", city: "İstanbul", manager: "Selin Öztürk", transactions: 4820, earnedPts: 148200, spentPts: 62400, status: "active" },
    { id: 2, name: "Ankara Ankamall", city: "Ankara", manager: "Kemal Arslan", transactions: 3210, earnedPts: 97800, spentPts: 41200, status: "active" },
    { id: 3, name: "İzmir Forum AVM", city: "İzmir", manager: "Deniz Kara", transactions: 2940, earnedPts: 88500, spentPts: 37900, status: "active" },
    { id: 4, name: "İstanbul Mall of Istanbul", city: "İstanbul", manager: "Pınar Erdem", transactions: 6750, earnedPts: 215000, spentPts: 98000, status: "active" },
    { id: 5, name: "Bursa Carrefour", city: "Bursa", manager: "Ali Can", transactions: 1840, earnedPts: 67200, spentPts: 28900, status: "active" },
    { id: 6, name: "Antalya TerraCity", city: "Antalya", manager: "Seda Yılmaz", transactions: 3920, earnedPts: 124500, spentPts: 56700, status: "active" },
    { id: 7, name: "Adana Optimum", city: "Adana", manager: "Murat Kaya", transactions: 2670, earnedPts: 89300, spentPts: 41200, status: "active" },
    { id: 8, name: "Konya Selçuklu AVM", city: "Konya", manager: "Elif Demir", transactions: 1450, earnedPts: 47800, spentPts: 21500, status: "active" },
    { id: 9, name: "Gaziantep Sanko Park", city: "Gaziantep", manager: "Ozan Şahin", transactions: 3180, earnedPts: 102400, spentPts: 48900, status: "active" },
    { id: 10, name: "Eskişehir AVM", city: "Eskişehir", manager: "Gizem Polat", transactions: 2210, earnedPts: 76500, spentPts: 33400, status: "active" },
    { id: 11, name: "İstanbul Zorlu Center", city: "İstanbul", manager: "Burcu Aksoy", transactions: 5340, earnedPts: 168900, spentPts: 78200, status: "active" },
    { id: 12, name: "İzmir Optimum", city: "İzmir", manager: "Tolga Erkan", transactions: 2890, earnedPts: 93400, spentPts: 42100, status: "active" },
    { id: 13, name: "Ankara Kentpark", city: "Ankara", manager: "Aylin Taş", transactions: 3760, earnedPts: 119800, spentPts: 55600, status: "active" },
    { id: 14, name: "Trabzon Forum", city: "Trabzon", manager: "Emir Can", transactions: 1620, earnedPts: 54300, spentPts: 23800, status: "active" },
    { id: 15, name: "Samsun AVM", city: "Samsun", manager: "Derya Kurt", transactions: 2540, earnedPts: 81200, spentPts: 36700, status: "active" },
    { id: 16, name: "Mersin Forum", city: "Mersin", manager: "Berkay Özdemir", transactions: 1980, earnedPts: 67800, spentPts: 29500, status: "active" },
    { id: 17, name: "Diyarbakır AVM", city: "Diyarbakır", manager: "Rabia Güneş", transactions: 1730, earnedPts: 58900, spentPts: 26400, status: "active" },
    { id: 18, name: "Kayseri AVM", city: "Kayseri", manager: "Fatih Çelik", transactions: 2310, earnedPts: 75600, spentPts: 34100, status: "active" },
    { id: 19, name: "Erzurum AVM", city: "Erzurum", manager: "Sinem Doğan", transactions: 1340, earnedPts: 46700, spentPts: 19800, status: "active" },
    { id: 20, name: "İstanbul Marmara Park", city: "İstanbul", manager: "Umut Aydın", transactions: 4120, earnedPts: 137500, spentPts: 62300, status: "active" },
  ];

  for (let i = 21; i <= 100; i++) {
    const city = cities[i % cities.length];
    const name = `${city} Branch-${i}`;
    const manager = managers[i % managers.length];
    list.push({
      id: i,
      name,
      city,
      manager,
      transactions: 1000 + (i * 37) % 5000,
      earnedPts: 30000 + (i * 997) % 150000,
      spentPts: 10000 + (i * 499) % 70000,
      status: "active",
    });
  }
  return list;
};
export const MOCK_BRANCHES = generateMockBranches();

// ─── 2. MOCK_TOP_CUSTOMERS ───────────────────────────────────────────────────
const generateMockTopCustomers = (): TopCustomer[] => {
  const list: TopCustomer[] = [
    { rank: 1, name: "Fatma Güler", phone: "0532 *** **11", earned: 18420, spent: 9200, level: "Platinum" },
    { rank: 2, name: "Mehmet Koç", phone: "0541 *** **72", earned: 14880, spent: 7400, level: "Gold" },
    { rank: 3, name: "Zeynep Aydın", phone: "0555 *** **43", earned: 12310, spent: 5100, level: "Gold" },
  ];

  const firstNames = ["Ahmet", "Ayşe", "Mustafa", "Elif", "Emre", "Zehra", "Burak", "Selin", "Can", "Deniz", "Ece", "Oğuz", "Dilara", "Kaan", "Beren", "Tolga", "Melis", "Merve", "Cihan", "Fatih"];
  const lastNames = ["Yılmaz", "Demir", "Şahin", "Kara", "Öztürk", "Çelik", "Arslan", "Yıldız", "Polat", "Erdoğan", "Kılıç", "Tekin", "Şen", "Kurt", "Acar", "Yalçın", "Doğan", "Aydın", "Aksoy", "Kaya"];

  for (let i = 4; i <= 100; i++) {
    const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
    const phone = `05${30 + (i % 70)} *** **${10 + (i % 90)}`;
    const earned = 5000 + (i * 123) % 12000;
    const spent = 2000 + (i * 79) % 5000;
    const level = earned > 15000 ? "Platinum" : earned > 8000 ? "Gold" : "Silver";
    list.push({ rank: i, name, phone, earned, spent, level });
  }
  return list;
};
export const MOCK_TOP_CUSTOMERS = generateMockTopCustomers();

// ─── 3. MOCK_CUSTOMERS ───────────────────────────────────────────────────────
const generateMockCustomers = (): Customer[] => {
  const list: Customer[] = [
    { id: "c1", firstName: "Fatma", lastName: "Güler", phone: "0532 111 22 33", email: "fatma@ornek.com", currentPoints: 4820 },
    { id: "c2", firstName: "Mehmet", lastName: "Koç", phone: "0541 222 33 44", email: "mehmet@ornek.com", currentPoints: 2140 },
    { id: "c3", firstName: "Zeynep", lastName: "Aydın", phone: "0555 333 44 55", email: "zeynep@ornek.com", currentPoints: 6310 },
    { id: "c4", firstName: "Ahmet", lastName: "Yılmaz", phone: "0533 444 55 66", email: "ahmet@ornek.com", currentPoints: 8750 },
    { id: "c5", firstName: "Ayşe", lastName: "Demir", phone: "0542 555 66 77", email: "ayse@ornek.com", currentPoints: 3240 },
    { id: "c6", firstName: "Mustafa", lastName: "Şahin", phone: "0556 666 77 88", email: "mustafa@ornek.com", currentPoints: 12900 },
    { id: "c7", firstName: "Elif", lastName: "Kara", phone: "0531 777 88 99", email: "elif@ornek.com", currentPoints: 5670 },
    { id: "c8", firstName: "Emre", lastName: "Öztürk", phone: "0543 888 99 00", email: "emre@ornek.com", currentPoints: 8930 },
    { id: "c9", firstName: "Zehra", lastName: "Çelik", phone: "0557 999 00 11", email: "zehra@ornek.com", currentPoints: 4120 },
    { id: "c10", firstName: "Burak", lastName: "Arslan", phone: "0534 000 11 22", email: "burak@ornek.com", currentPoints: 7650 },
    { id: "c11", firstName: "Selin", lastName: "Yıldız", phone: "0544 111 22 33", email: "selin@ornek.com", currentPoints: 2340 },
    { id: "c12", firstName: "Can", lastName: "Polat", phone: "0558 222 33 44", email: "can@ornek.com", currentPoints: 10850 },
    { id: "c13", firstName: "Deniz", lastName: "Erdoğan", phone: "0535 333 44 55", email: "deniz@ornek.com", currentPoints: 6720 },
    { id: "c14", firstName: "Ece", lastName: "Kılıç", phone: "0545 444 55 66", email: "ece@ornek.com", currentPoints: 3910 },
    { id: "c15", firstName: "Oğuz", lastName: "Tekin", phone: "0559 555 66 77", email: "oguz@ornek.com", currentPoints: 14560 },
    { id: "c16", firstName: "Dilara", lastName: "Şen", phone: "0536 666 77 88", email: "dilara@ornek.com", currentPoints: 5280 },
    { id: "c17", firstName: "Kaan", lastName: "Kurt", phone: "0546 777 88 99", email: "kaan@ornek.com", currentPoints: 7340 },
    { id: "c18", firstName: "Beren", lastName: "Acar", phone: "0560 888 99 00", email: "beren@ornek.com", currentPoints: 2890 },
    { id: "c19", firstName: "Tolga", lastName: "Yalçın", phone: "0537 999 00 11", email: "tolga@ornek.com", currentPoints: 9620 },
    { id: "c20", firstName: "Melis", lastName: "Doğan", phone: "0547 000 11 22", email: "melis@ornek.com", currentPoints: 4710 },
  ];

  const firstNames = ["Ahmet", "Ayşe", "Mustafa", "Elif", "Emre", "Zehra", "Burak", "Selin", "Can", "Deniz", "Ece", "Oğuz", "Dilara", "Kaan", "Beren", "Tolga", "Melis", "Merve", "Cihan", "Fatih"];
  const lastNames = ["Yılmaz", "Demir", "Şahin", "Kara", "Öztürk", "Çelik", "Arslan", "Yıldız", "Polat", "Erdoğan", "Kılıç", "Tekin", "Şen", "Kurt", "Acar", "Yalçın", "Doğan", "Aydın"];

  for (let i = 21; i <= 100; i++) {
    const fName = firstNames[i % firstNames.length];
    const lName = lastNames[i % lastNames.length];
    list.push({
      id: `c${i}`,
      firstName: fName,
      lastName: lName,
      phone: `05${30 + (i % 70)} ${(100 + i).toString()} ${(10 + i % 90).toString()} ${(20 + i % 80).toString()}`,
      email: `${fName.toLowerCase()}${i}@ornek.com`,
      currentPoints: 1000 + (i * 350) % 15000,
    });
  }
  return list;
};
export const MOCK_CUSTOMERS = generateMockCustomers();

// ─── 4. MOCK_ORGS ────────────────────────────────────────────────────────────
const generateMockOrgs = (): Organization[] => {
  const list: Organization[] = [
    { id: "mock-1", name: "Migros Ticaret A.Ş.", slug: "migros", email: "cto@migros.com.tr", branches: 312, created: "2023-03-12", status: "active", customers: 148200, txVolume: 4820000 },
    { id: "mock-2", name: "CarrefourSA", slug: "carrefoursa", email: "admin@carrefour.com.tr", branches: 87, created: "2023-07-01", status: "active", customers: 62400, txVolume: 1940000 },
  ];

  const names = ["BİM", "A101", "ŞOK", "Metro", "Macrocenter", "Bizim Toptan", "Özdilek", "Kipa", "Mopaş", "Hakmar"];

  for (let i = 3; i <= 100; i++) {
    const baseName = names[i % names.length];
    const name = `${baseName} Marketler Zinciri ${i}`;
    const slug = `${baseName.toLowerCase().replace("ö", "o").replace("ş", "s")}-${i}`;
    list.push({
      id: `mock-${i}`,
      name,
      slug,
      email: `contact@${slug}.com.tr`,
      branches: 5 + (i * 7) % 150,
      created: `2024-01-${(i % 28) + 1}`,
      status: "active",
      customers: 1000 + (i * 456) % 50000,
      txVolume: 50000 + (i * 9876) % 1000000,
    });
  }
  return list;
};
export const MOCK_ORGS = generateMockOrgs();

// ─── 5. INITIAL_LOGS ─────────────────────────────────────────────────────────
const generateInitialLogs = (): ActivityLogItem[] => {
  const list: ActivityLogItem[] = [
    { id: 1, type: "success", msg: "Yeni Patron davet edildi", time: "14:32:01", actor: "super-admin" },
    { id: 2, type: "warn", msg: "Sistem heartbeat kontrolü geçti", time: "14:29:47", actor: "health-checker" },
  ];

  const types: ("success" | "warn" | "error" | "info")[] = ["success", "warn", "error", "info"];
  const msgs = ["Yeni Şube eklendi", "Kasiyer girişi yapıldı", "Veritabanı yedeklendi", "API bağlantısı kontrol edildi", "Kullanıcı şifresi sıfırlandı", "Puan transfer işlemi başarılı"];
  const actors = ["super-admin", "manager", "cashier", "system", "cron-job"];

  for (let i = 3; i <= 100; i++) {
    const type = types[i % types.length];
    const msg = `${msgs[i % msgs.length]} (Log ID: ${i})`;
    const actor = actors[i % actors.length];
    list.push({
      id: i,
      type,
      msg,
      time: `14:${(10 + i % 40).toString().padStart(2, "0")}:${(10 + i % 50).toString().padStart(2, "0")}`,
      actor,
    });
  }
  return list;
};
export const INITIAL_LOGS = generateInitialLogs();

// ─── 6. MOCK_TRANSACTIONS ─────────────────────────────────────────────────────
const generateMockTransactions = (): RecentTxRow[] => {
  const list: RecentTxRow[] = [
    { id: "mock-1", organizationId: "org-1", branchId: "branch-1", customerId: "c-1", cashierId: "cashier-1", type: "EARN", amountSpent: 12500, pointsAmount: 12, createdAtFormatted: "Bugün, 21:05", customerName: "Alperen Şongüt", customerPhone: "0532 111 2233", cashierName: "Salimhan Kızılırmak", status: "SUCCESS" },
    { id: "mock-2", organizationId: "org-1", branchId: "branch-1", customerId: "c-2", cashierId: "cashier-1", type: "BURN", amountSpent: null, pointsAmount: 50, createdAtFormatted: "Bugün, 19:40", customerName: "Cihan Demir", customerPhone: "0543 222 3344", cashierName: "Salimhan Kızılırmak", status: "SUCCESS" },
    { id: "mock-3", organizationId: "org-1", branchId: "branch-1", customerId: "c-3", cashierId: "cashier-1", type: "EARN", amountSpent: 45000, pointsAmount: 45, createdAtFormatted: "Dün, 18:20", customerName: "Merve Yılmaz", customerPhone: "0555 333 4455", cashierName: "Salimhan Kızılırmak", status: "SUCCESS" },
    { id: "mock-4", organizationId: "org-1", branchId: "branch-1", customerId: "c-1", cashierId: "cashier-1", type: "EARN", amountSpent: 20000, pointsAmount: 20, createdAtFormatted: "Dün, 14:15", customerName: "Alperen Şongüt", customerPhone: "0532 111 2233", cashierName: "Salimhan Kızılırmak", status: "VOIDED" },
    { id: "mock-5", organizationId: "org-1", branchId: "branch-1", customerId: "c-4", cashierId: "cashier-1", type: "VOID", amountSpent: -20000, pointsAmount: -20, createdAtFormatted: "Dün, 14:16", customerName: "Alperen Şongüt", customerPhone: "0532 111 2233", cashierName: "Salimhan Kızılırmak", status: "SUCCESS", parentTransactionId: "mock-4" },
    { id: "mock-6", organizationId: "org-1", branchId: "branch-1", customerId: "c-5", cashierId: "cashier-1", type: "EARN", amountSpent: 10000, pointsAmount: 10, createdAtFormatted: "Dün, 11:00", customerName: "Ahmet Yılmaz", customerPhone: "0533 444 5566", cashierName: "Salimhan Kızılırmak", status: "SUCCESS" },
  ];

  const names = ["Alperen Şongüt", "Cihan Demir", "Merve Yılmaz", "Ahmet Yılmaz", "Selin Öztürk", "Gizem Polat", "Umut Aydın", "Tolga Erkan", "Gizem Polat", "Aylin Taş"];

  for (let i = 7; i <= 100; i++) {
    const type = i % 3 === 0 ? "VOID" : i % 2 === 0 ? "BURN" : "EARN";
    const amountSpent = type === "BURN" ? null : 5000 + (i * 350) % 50000;
    list.push({
      id: `mock-${i}`,
      organizationId: "org-1",
      branchId: "branch-1",
      customerId: `c-${(i % 20) + 1}`,
      cashierId: "cashier-1",
      type,
      amountSpent,
      pointsAmount: type === "VOID" ? -10 : type === "BURN" ? 20 : 15,
      createdAtFormatted: `Bugün, ${(10 + i % 12).toString().padStart(2, "0")}:${(10 + i % 50).toString().padStart(2, "0")}`,
      customerName: names[i % names.length],
      customerPhone: `0532 111 22${(33 + i % 66).toString().padStart(2, "0")}`,
      cashierName: "Salimhan Kızılırmak",
      status: type === "VOID" ? "VOIDED" : "SUCCESS",
    });
  }
  return list;
};
export const MOCK_TRANSACTIONS = generateMockTransactions();

// ─── 7. INITIAL_MOCK_TRANSACTIONS ────────────────────────────────────────────
const generateInitialMockTransactions = (): Transaction[] => {
  const list: Transaction[] = [
    { id: "mock-1", organizationId: "org-1", branchId: "branch-1", customerId: "c-1", cashierId: "cashier-1", type: "EARN", amountSpent: 12500, pointsAmount: 12, status: "SUCCESS", createdAtFormatted: "31.05.2026 21:05", createdAt: new Date("2026-05-31T21:05:00"), customerName: "Alperen Şongüt", customerPhone: "0532 111 2233", cashierName: "Salimhan Kızılırmak", cashierEmail: "salimhan@example.com" },
    { id: "mock-2", organizationId: "org-1", branchId: "branch-1", customerId: "c-2", cashierId: "cashier-1", type: "BURN", amountSpent: null, pointsAmount: -50, status: "SUCCESS", createdAtFormatted: "31.05.2026 19:40", createdAt: new Date("2026-05-31T19:40:00"), customerName: "Cihan Demir", customerPhone: "0543 222 3344", cashierName: "Salimhan Kızılırmak", cashierEmail: "salimhan@example.com" },
    { id: "mock-3", organizationId: "org-1", branchId: "branch-1", customerId: "c-3", cashierId: "cashier-1", type: "EARN", amountSpent: 45000, pointsAmount: 45, status: "SUCCESS", createdAtFormatted: "30.05.2026 18:20", createdAt: new Date("2026-05-30T18:20:00"), customerName: "Merve Yılmaz", customerPhone: "0555 333 4455", cashierName: "Salimhan Kızılırmak", cashierEmail: "salimhan@example.com" },
    { id: "mock-4", organizationId: "org-1", branchId: "branch-1", customerId: "c-1", cashierId: "cashier-1", type: "EARN", amountSpent: 20000, pointsAmount: 20, status: "VOIDED", createdAtFormatted: "30.05.2026 14:15", createdAt: new Date("2026-05-30T14:15:00"), customerName: "Alperen Şongüt", customerPhone: "0532 111 2233", cashierName: "Salimhan Kızılırmak", cashierEmail: "salimhan@example.com" },
    { id: "mock-5", organizationId: "org-1", branchId: "branch-1", customerId: "c-1", cashierId: "cashier-1", type: "VOID", amountSpent: -20000, pointsAmount: -20, status: "SUCCESS", parentTransactionId: "mock-4", createdAtFormatted: "30.05.2026 14:16", createdAt: new Date("2026-05-30T14:16:00"), customerName: "Alperen Şongüt", customerPhone: "0532 111 2233", cashierName: "Salimhan Kızılırmak", cashierEmail: "salimhan@example.com" },
    { id: "mock-6", organizationId: "org-1", branchId: "branch-1", customerId: "c-4", cashierId: "cashier-1", type: "EARN", amountSpent: 10000, pointsAmount: 10, status: "SUCCESS", createdAtFormatted: "29.05.2026 11:00", createdAt: new Date("2026-05-29T11:00:00"), customerName: "Ahmet Yılmaz", customerPhone: "0533 444 5566", cashierName: "Salimhan Kızılırmak", cashierEmail: "salimhan@example.com" },
  ];

  const names = ["Alperen Şongüt", "Cihan Demir", "Merve Yılmaz", "Ahmet Yılmaz", "Selin Öztürk", "Gizem Polat", "Umut Aydın", "Tolga Erkan", "Gizem Polat", "Aylin Taş"];

  for (let i = 7; i <= 100; i++) {
    const type = i % 3 === 0 ? "VOID" : i % 2 === 0 ? "BURN" : "EARN";
    const amountSpent = type === "BURN" ? null : 5000 + (i * 350) % 50000;
    list.push({
      id: `mock-${i}`,
      organizationId: "org-1",
      branchId: "branch-1",
      customerId: `c-${(i % 20) + 1}`,
      cashierId: "cashier-1",
      type,
      amountSpent,
      pointsAmount: type === "VOID" ? -10 : type === "BURN" ? -20 : 15,
      status: type === "VOID" ? "VOIDED" : "SUCCESS",
      createdAtFormatted: `${(10 + i % 20)}.${(i % 12 + 1).toString().padStart(2, "0")}.2026 14:00`,
      createdAt: new Date(`2026-06-${(10 + i % 20).toString().padStart(2, "0")}T14:00:00`),
      customerName: names[i % names.length],
      customerPhone: `0532 111 22${(33 + i % 66).toString().padStart(2, "0")}`,
      cashierName: "Salimhan Kızılırmak",
      cashierEmail: "salimhan@example.com",
    });
  }
  return list;
};
export const INITIAL_MOCK_TRANSACTIONS = generateInitialMockTransactions();

// ─── 8. MOCK_CUSTOMER_DATA ───────────────────────────────────────────────────
export const MOCK_CUSTOMER_DATA: CustomerData = {
  id: "mock_cust_123",
  clerkId: "mock_clerk_123",
  firstName: "Alperen",
  lastName: "Songüt",
  email: "alperen@mockcustomer.com",
  phone: "+905554443322",
  currentPoints: 45000,
};

// ─── 9. MOCK_LEDGER_TRANSACTIONS ──────────────────────────────────────────────
const generateMockLedgerTransactions = (): LedgerTransaction[] => {
  const list: LedgerTransaction[] = [
    { id: "mock_tx_1", refId: "REF-XYZ987", type: "SPLIT_PAYMENT", amountSpent: 50.00, pointsAmount: -450, totalCartAmount: 500.00, description: "REF-XYZ987 nolu 500 TL tutarındaki alışveriş.", status: "SUCCESS", createdAtFormatted: "01.06.2026 14:30", createdAt: new Date("2026-06-01T14:30:00").toISOString(), branchName: "Nişantaşı Şubesi" },
    { id: "mock_tx_2", refId: "REF-ABC123", type: "EARN", amountSpent: 150.00, pointsAmount: 15, totalCartAmount: 150.00, description: "150 TL tutarında puan kazanma alışverişi.", status: "SUCCESS", createdAtFormatted: "28.05.2026 18:15", createdAt: new Date("2026-05-28T18:15:00").toISOString(), branchName: "Beşiktaş Şubesi" },
    { id: "mock_tx_3", refId: "REF-VOID45", type: "SPLIT_PAYMENT", amountSpent: 100.00, pointsAmount: -100, totalCartAmount: 200.00, description: "REF-VOID45 nolu alışveriş iptal edilmiştir.", status: "VOIDED", createdAtFormatted: "25.05.2026 12:00", createdAt: new Date("2026-05-25T12:00:00").toISOString(), branchName: "Kadıköy Şubesi" },
    { id: "mock_tx_4", refId: "REF-KRT555", type: "EARN", amountSpent: 300.00, pointsAmount: 30, totalCartAmount: 300.00, description: "Puan kazanımı.", status: "SUCCESS", createdAtFormatted: "24.05.2026 15:45", createdAt: new Date("2026-05-24T15:45:00").toISOString(), branchName: "Ataşehir Şubesi" },
    { id: "mock_tx_5", refId: "REF-BRN111", type: "BURN", amountSpent: 0.00, pointsAmount: -200, totalCartAmount: 200.00, description: "Puan harcama.", status: "SUCCESS", createdAtFormatted: "22.05.2026 09:30", createdAt: new Date("2026-05-22T09:30:00").toISOString(), branchName: "Caddebostan Şubesi" },
    { id: "mock_tx_6", refId: "REF-XYZ111", type: "SPLIT_PAYMENT", amountSpent: 120.00, pointsAmount: -80, totalCartAmount: 200.00, description: "Parçalı Ödeme.", status: "SUCCESS", createdAtFormatted: "20.05.2026 19:10", createdAt: new Date("2026-05-20T19:10:00").toISOString(), branchName: "Bebek Şubesi" },
    { id: "mock_tx_7", refId: "REF-XYZ222", type: "EARN", amountSpent: 80.00, pointsAmount: 8, totalCartAmount: 80.00, description: "Puan kazanımı.", status: "SUCCESS", createdAtFormatted: "18.05.2026 11:20", createdAt: new Date("2026-05-18T11:20:00").toISOString(), branchName: "Göztepe Şubesi" },
  ];

  const branchesList = ["Nişantaşı Şubesi", "Beşiktaş Şubesi", "Kadıköy Şubesi", "Ataşehir Şubesi", "Caddebostan Şubesi", "Bebek Şubesi", "Göztepe Şubesi"];

  for (let i = 8; i <= 100; i++) {
    const type = i % 3 === 0 ? "VOID" : i % 2 === 0 ? "BURN" : "EARN";
    list.push({
      id: `mock_tx_${i}`,
      refId: `REF-XYZ${100 + i}`,
      type,
      amountSpent: type === "BURN" ? 0 : 100 + (i * 15) % 800,
      pointsAmount: type === "VOID" ? -10 : type === "BURN" ? -150 : 25,
      totalCartAmount: 100 + (i * 15) % 800,
      description: type === "VOID" ? "Alışveriş iptali." : type === "BURN" ? "Puan harcama." : "Puan kazanımı.",
      status: type === "VOID" ? "VOIDED" : "SUCCESS",
      createdAtFormatted: `${(10 + i % 20)}.${(i % 12 + 1).toString().padStart(2, "0")}.2026 15:00`,
      createdAt: new Date(`2026-06-${(10 + i % 20).toString().padStart(2, "0")}T15:00:00`).toISOString(),
      branchName: branchesList[i % branchesList.length],
    });
  }
  return list;
};
export const MOCK_LEDGER_TRANSACTIONS = generateMockLedgerTransactions();

// ─── 10. MOCK_DAILY_VOLUMES ──────────────────────────────────────────────────
export const MOCK_DAILY_VOLUMES: number[] = Array.from({ length: 100 }, (_, i) => 200 + (i * 17) % 800);

// ─── 11. MOCK_CASHIER_STATS ──────────────────────────────────────────────────
export const MOCK_CASHIER_STATS = {
  totalTxToday: 24,
  ptsGivenToday: 1420,
  newMembersToday: 5
};

// ─── 12. MOCK_AUDIT_TRANSACTIONS ──────────────────────────────────────────────
const generateMockAuditTransactions = (): TransactionData[] => {
  const list: TransactionData[] = [
    { id: "audit-1", type: "EARN", amountSpent: 15000, pointsAmount: 15, status: "SUCCESS", createdAtFormatted: "01.06.2026 11:30" },
    { id: "audit-2", type: "BURN", amountSpent: null, pointsAmount: -50, status: "SUCCESS", createdAtFormatted: "30.05.2026 15:45" },
    { id: "audit-3", type: "EARN", amountSpent: 20000, pointsAmount: 20, status: "VOIDED", createdAtFormatted: "28.05.2026 09:15" },
    { id: "audit-4", type: "VOID", amountSpent: -20000, pointsAmount: -20, status: "SUCCESS", parentTransactionId: "audit-3", createdAtFormatted: "28.05.2026 09:20" },
    { id: "audit-5", type: "EARN", amountSpent: 8000, pointsAmount: 8, status: "SUCCESS", createdAtFormatted: "25.05.2026 17:10" },
  ];

  for (let i = 6; i <= 100; i++) {
    const type = i % 3 === 0 ? "VOID" : i % 2 === 0 ? "BURN" : "EARN";
    const amountSpent = type === "BURN" ? null : 5000 + (i * 350) % 50000;
    list.push({
      id: `audit-${i}`,
      type,
      amountSpent,
      pointsAmount: type === "VOID" ? -10 : type === "BURN" ? -150 : 25,
      status: type === "VOID" ? "VOIDED" : "SUCCESS",
      parentTransactionId: type === "VOID" ? `audit-${i - 1}` : undefined,
      createdAtFormatted: `${(10 + i % 20).toString().padStart(2, "0")}.${(i % 12 + 1).toString().padStart(2, "0")}.2026 15:00`,
    });
  }
  return list;
};
export const MOCK_AUDIT_TRANSACTIONS = generateMockAuditTransactions();

// ─── 13. MOCK_CASHIER_CUSTOMER ────────────────────────────────────────────────
export const MOCK_CASHIER_CUSTOMER: CashierCustomerData = {
  id: "mock_cust_1",
  name: "Ahmet Yılmaz",
  phone: "0532 111 22 33",
  pts: 450,
  tier: "Gold",
  totalTx: 12,
  avatar: "A",
  createdAt: "15.01.2026",
};

