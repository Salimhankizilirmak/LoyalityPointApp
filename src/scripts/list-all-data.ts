import * as dotenv from "dotenv";
import { resolve } from "path";

// 🛡️ ÖNCELİKLİ: Env yüklemesini en başta yap
dotenv.config({ path: resolve(__dirname, "../../.env.local") });

async function listAllData() {
  // Dinamik import ile db'yi yükle (Env yüklendikten sonra)
  const { db } = await import("../db");
  const { organizations, staff, customers } = await import("../db/schema");

  console.log("\n🚀 --- SİSTEM VERİ LİSTESİ ---\n");

  // 1. Süper Adminler (Env'den)
  const superAdmins = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);
  console.log("👑 SÜPER ADMINLER (Config):");
  if (superAdmins.length === 0) console.log(" - Kayıt yok");
  superAdmins.forEach(email => console.log(` - ${email}`));

  // 2. Organizasyonlar
  const orgs = await db.select().from(organizations).all();
  console.log("\n🏢 ORGANİZASYONLAR:");
  if (orgs.length === 0) console.log(" - Kayıt yok");
  orgs.forEach(o => {
    console.log(` - [${o.id}] ${o.name} (${o.bossEmail}) | Aktif: ${o.isActive} | Vitrin: ${o.isShowcase}`);
  });

  // 3. Bosslar (Organizasyonlardaki boss_email'ler üzerinden)
  const uniqueBosses = Array.from(new Set(orgs.map(o => o.bossEmail))).filter(Boolean);
  console.log("\n💼 BOSSLAR (Organizasyon Sahibi):");
  if (uniqueBosses.length === 0) console.log(" - Kayıt yok");
  uniqueBosses.forEach(email => console.log(` - ${email}`));

  // 4. Personel (Yönetici ve Kasiyer)
  const allStaff = await db.select().from(staff).all();
  console.log("\n👥 PERSONEL (Yönetici & Kasiyer):");
  if (allStaff.length === 0) console.log(" - Kayıt yok");
  allStaff.forEach(s => {
    console.log(` - [${s.id}] Rol: ${s.role} | Şube ID: ${s.branchId} | Org ID: ${s.orgId} | Aktif: ${s.isActive}`);
  });

  // 5. Müşteriler
  const allCustomers = await db.select().from(customers).all();
  console.log("\n📱 MÜŞTERİLER:");
  if (allCustomers.length === 0) console.log(" - Kayıt yok");
  allCustomers.forEach(c => {
    console.log(` - [${c.id}] ${c.firstName} ${c.lastName} | ${c.phone} | ${c.email} | Puan: ${c.currentPoints}`);
  });

  console.log("\n--- LİSTELEME TAMAMLANDI ---\n");
}

listAllData().catch(console.error);
