"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const schema_1 = require("./schema");
const drizzle_orm_1 = require("drizzle-orm");
async function main() {
    console.log("🚀 [SEED] Veritabanı tohumlama işlemi başlatılıyor...");
    try {
        await index_1.db.transaction(async (tx) => {
            // 1. Mevcut organizasyonları çek
            const allOrgs = await tx.select().from(schema_1.organizations);
            console.log(`[SEED] Toplam ${allOrgs.length} organizasyon bulundu.`);
            for (const org of allOrgs) {
                // Her organizasyon için varsayılan kural kontrolü
                const existingRules = await tx
                    .select()
                    .from(schema_1.loyaltyRules)
                    .where((0, drizzle_orm_1.eq)(schema_1.loyaltyRules.organizationId, org.id))
                    .limit(1);
                if (existingRules.length === 0) {
                    console.log(`[SEED] Organizasyon '${org.name}' (${org.id}) için varsayılan sadakat kuralı (%10) ekleniyor...`);
                    await tx
                        .insert(schema_1.loyaltyRules)
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
    }
    catch (error) {
        console.error("❌ [SEED] Tohumlama sırasında bir hata oluştu:", error);
        process.exit(1);
    }
}
main();
