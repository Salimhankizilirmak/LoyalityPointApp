import { db } from "./index";
import { organizations, loyaltyRules } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🚀 [SEED] Veritabanı tohumlama işlemi başlatılıyor...");

  try {
    await db.transaction(async (tx) => {
      // 1. Mevcut organizasyonları çek
      const allOrgs = await tx.select().from(organizations);
      console.log(`[SEED] Toplam ${allOrgs.length} organizasyon bulundu.`);

      for (const org of allOrgs) {
        // Her organizasyon için varsayılan kural kontrolü
        const existingRules = await tx
          .select()
          .from(loyaltyRules)
          .where(eq(loyaltyRules.organizationId, org.id))
          .limit(1);

        if (existingRules.length === 0) {
          console.log(`[SEED] Organizasyon '${org.name}' (${org.id}) için varsayılan sadakat kuralı (%10) ekleniyor...`);
          await tx
            .insert(loyaltyRules)
            .values({
              organizationId: org.id,
              earnRatio: 10,
            })
            .onConflictDoNothing();
        }
      }
    });

    console.log("✅ [SEED] Veritabanı başarıyla tohumlandı!");
    process.exit(0);
  } catch (error) {
    console.error("❌ [SEED] Tohumlama sırasında bir hata oluştu:", error);
    process.exit(1);
  }
}

main();
