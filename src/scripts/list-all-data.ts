import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../../.env.local") });

async function listAllData() {
  const { db } = await import("../db");
  const { organizations, staffProfiles, customerProfiles, users, branches } = await import("../db/schema");
  const { eq } = await import("drizzle-orm");

  console.log("\n🚀 --- SİSTEM VERİ LİSTESİ ---\n");

  // 1. Tüm Kullanıcılar
  const allUsers = await db.select().from(users).all();
  console.log("👑 KULLANICILAR (Rol Bazlı):");
  if (allUsers.length === 0) console.log(" - Kayıt yok");
  allUsers.forEach(u => {
    console.log(` - [${u.id}] Email: ${u.email} | Rol: ${u.role} | Clerk: ${u.clerkId}`);
  });

  // 2. Organizasyonlar
  const orgs = await db.select().from(organizations).all();
  console.log("\n🏢 ORGANİZASYONLAR:");
  if (orgs.length === 0) console.log(" - Kayıt yok");
  for (const o of orgs) {
    const bossUser = allUsers.find(u => u.id === o.bossId);
    console.log(` - [${o.id}] ${o.name} | Boss ID: ${o.bossId} (${bossUser?.email || "Bilinmiyor"}) | Aktif: ${o.isActive} | Şube Sınırı: ${o.branchLimit}`);
  }

  // 3. Personeller
  const staff = await db.select({
    id: staffProfiles.id,
    userId: staffProfiles.userId,
    branchId: staffProfiles.branchId,
    email: users.email,
    role: users.role,
    branchName: branches.name,
  })
  .from(staffProfiles)
  .innerJoin(users, eq(staffProfiles.userId, users.id))
  .innerJoin(branches, eq(staffProfiles.branchId, branches.id))
  .all();

  console.log("\n👥 PERSONEL (Yönetici & Kasiyer):");
  if (staff.length === 0) console.log(" - Kayıt yok");
  staff.forEach(s => {
    console.log(` - [${s.id}] User ID: ${s.userId} (${s.email}) | Rol: ${s.role} | Şube: ${s.branchName} (${s.branchId})`);
  });

  // 4. Müşteriler
  const customers = await db.select({
    id: customerProfiles.id,
    userId: customerProfiles.userId,
    orgId: customerProfiles.orgId,
    currentPoints: customerProfiles.currentPoints,
    email: users.email,
  })
  .from(customerProfiles)
  .innerJoin(users, eq(customerProfiles.userId, users.id))
  .all();

  console.log("\n📱 MÜŞTERİLER:");
  if (customers.length === 0) console.log(" - Kayıt yok");
  customers.forEach(c => {
    console.log(` - [${c.id}] User ID: ${c.userId} (${c.email}) | Org ID: ${c.orgId} | Puan: ${c.currentPoints}`);
  });

  console.log("\n--- LİSTELEME TAMAMLANDI ---\n");
}

listAllData().catch(console.error);
