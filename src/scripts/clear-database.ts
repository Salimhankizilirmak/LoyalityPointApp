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
  console.log("🛡️  GÜVENLİK DENETİMİ: TÜM VERİTABANINI TEMİZLEME");
  console.log("====================================================\n");

  if (process.env.NODE_ENV === "production" && process.env.SECURITY_WIPE_BYPASS !== "true") {
    console.error("❌ HATA: Canlı (Production) ortamda bu scripti çalıştıramazsınız!");
    console.error("Güvenlik nedeniyle işlem durduruldu.");
    process.exit(1);
  }

  const question = (query: string) => new Promise((resolve) => rl.question(query, resolve));

  console.log("⚠️  ÇOK KRİTİK UYARI: Bu işlem GERİ DÖNDÜRÜLEMEZ!");
  console.log("Veritabanındaki TÜM TABLOLAR (kullanıcılar, organizasyonlar, şubeler, işlemler, kurallar) tamamen silinecektir.\n");

  const confirmation = await question("Devam etmek için 'VERILERI_TAMAMEN_SIL' yazın: ");

  if (confirmation !== "VERILERI_TAMAMEN_SIL") {
    console.log("\n❌ İşlem iptal edildi. Onay kodu eşleşmedi.");
    process.exit(0);
  }

  console.log("\n🚀 İşlem onaylandı. Tüm tablolar sırayla temizleniyor...\n");

  const { db } = await import("../db");
  const { 
    pointsTransactions, 
    loyaltyTransactions, 
    userBranches, 
    customerProfiles, 
    staffProfiles, 
    customers, 
    loyaltyRules, 
    branches, 
    organizations, 
    users 
  } = await import("../db/schema");

  try {
    console.log("1. Points Transactions (Sadakat Puan İşlemleri) siliniyor...");
    await db.delete(pointsTransactions);
    console.log("✅ Puan işlemleri silindi.");

    console.log("2. Loyalty Transactions (Genel Sadakat İşlemleri) siliniyor...");
    await db.delete(loyaltyTransactions);
    console.log("✅ Sadakat işlemleri silindi.");

    console.log("3. User Branches (Kullanıcı Şube İlişkileri) siliniyor...");
    await db.delete(userBranches);
    console.log("✅ Kullanıcı şube ilişkileri silindi.");

    console.log("4. Customer Profiles (Müşteri Profilleri) siliniyor...");
    await db.delete(customerProfiles);
    console.log("✅ Müşteri profilleri silindi.");

    console.log("5. Staff Profiles (Personel Profilleri) siliniyor...");
    await db.delete(staffProfiles);
    console.log("✅ Personel profilleri silindi.");

    console.log("6. Customers (Müşteriler) siliniyor...");
    await db.delete(customers);
    console.log("✅ Müşteriler silindi.");

    console.log("7. Loyalty Rules (Sadakat Kuralları) siliniyor...");
    await db.delete(loyaltyRules);
    console.log("✅ Sadakat kuralları silindi.");

    console.log("8. Branches (Şubeler) siliniyor...");
    await db.delete(branches);
    console.log("✅ Şubeler silindi.");

    console.log("9. Organizations (Organizasyonlar) siliniyor...");
    await db.delete(organizations);
    console.log("✅ Organizasyonlar silindi.");

    console.log("10. Users (Tüm Kullanıcılar) siliniyor...");
    await db.delete(users);
    console.log("✅ Tüm kullanıcılar silindi.");

    console.log("\n🎉 TEBRİKLER: VERİTABANINDAKİ TÜM VERİLER BAŞARIYLA TEMİZLENDİ! 🎉");
    console.log("Sistem tamamen sıfır durumundadır. Artık yeni kayıtları kabul etmeye hazırdır.");

  } catch (error) {
    console.error("\n❌ Veri silme işlemi sırasında bir hata oluştu:", error);
    console.log("Hata detayı:", error instanceof Error ? error.message : String(error));
  } finally {
    rl.close();
  }
}

clearDatabase().catch((err) => {
  console.error(err);
  rl.close();
});
