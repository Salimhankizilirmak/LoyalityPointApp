import * as dotenv from "dotenv";
import { resolve } from "path";
import * as readline from "readline";

// npx tsx src/scripts/clear-database.ts
dotenv.config({ path: resolve(__dirname, "../../.env.local") });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function clearDatabase() {
  console.log("\n====================================================");
  console.log("🛡️  GÜVENLİK DENETİMİ: VERİTABANI SIFIRLAMA");
  console.log("====================================================\n");

  // 1. CANLI SİSTEM KONTROLÜ (NODE_ENV)
  if (process.env.NODE_ENV === "production" && process.env.SECURITY_WIPE_BYPASS !== "true") {
    console.error("❌ HATA: Canlı (Production) ortamda bu scripti çalıştıramazsınız!");
    console.error("Güvenlik nedeniyle işlem durduruldu.");
    process.exit(1);
  }

  // 2. BYPASS FLAG KONTROLÜ
  if (process.env.SECURITY_WIPE_BYPASS !== "true") {
    console.error("❌ HATA: SECURITY_WIPE_BYPASS=.env.local içinde 'true' olmalıdır.");
    process.exit(1);
  }

  // 3. İNTERAKTİF ONAY
  const question = (query: string) => new Promise((resolve) => rl.question(query, resolve));
  
  console.log("⚠️  DİKKAT: Bu işlem GERİ DÖNDÜRÜLEMEZ!");
  console.log("Tüm şubeler, müşteriler, puanlar ve işlemler silinecektir.\n");
  
  const confirmation = await question("Devam etmek için 'SISTEMI_SIFIRLA' yazın: ");

  if (confirmation !== "SISTEMI_SIFIRLA") {
    console.log("\n❌ İşlem iptal edildi. Hatalı onay kodu.");
    process.exit(0);
  }

  console.log("\n🚀 İşlem onaylandı. Veriler siliniyor...\n");

  const { db } = await import("../db");
  const { organizations, staff, customers, pointsTransactions, branches } = await import("../db/schema");

  try {
    console.log("1. Transactions (İşlemler) siliniyor...");
    await db.delete(pointsTransactions);
    console.log("✅ İşlemler silindi.");

    console.log("2. Customers (Müşteriler) siliniyor...");
    await db.delete(customers);
    console.log("✅ Müşteriler silindi.");

    console.log("3. Staff (Personeller - Manager & Cashier) siliniyor...");
    await db.delete(staff);
    console.log("✅ Personeller silindi.");

    console.log("4. Branches (Şubeler) siliniyor...");
    await db.delete(branches);
    console.log("✅ Şubeler silindi.");

    console.log("5. Organizations (Ana Organizasyonlar) siliniyor...");
    await db.delete(organizations);
    console.log("✅ Organizasyonlar silindi.");

    console.log("\n🎉 TÜM YEREL VERİLER BAŞARIYLA SİLİNDİ! 🎉");
    console.log("-------------------------------------------------------------------");
    console.log("🔴 KRİTİK GÜVENLİK NOTU:");
    console.log("Bu işlem SADECE yerel Turso veritabanını temizlemiştir.");
    console.log("Clerk üzerindeki 'Bekleyen Davetler' (Invitations) hala AKTİFTİR.");
    console.log("Güvenlik için Clerk Dashboard üzerinden davetleri manuel silmelisiniz:");
    console.log("-> Clerk Dashboard > Organizations > [Org Seç] > Invitations");
    console.log("-------------------------------------------------------------------");
    console.log("Sistemde şu an sadece .env.local dosyasındaki Süper Adminler bulunmaktadır.");

  } catch (error) {
    console.error("\n❌ Veri silme işlemi sırasında bir hata oluştu:", error);
    console.log("Hata detayı:", error instanceof Error ? error.message : String(error));
  } finally {
    rl.close();
  }
}

// Güvenlik katmanları nedeniyle doğrudan execute ediyoruz
clearDatabase().catch((err) => {
  console.error(err);
  rl.close();
});
