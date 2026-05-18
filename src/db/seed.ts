import { db } from "./index";
import { organizations, loyaltyRules, pendingInvitations } from "./schema";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";

async function main() {
  console.log("🚀 [SEED] Veritabanı tohumlama işlemi başlatılıyor...");

  try {
    const client = await clerkClient();

    await db.transaction(async (tx) => {
      // 1. Mevcut organizasyonları çek
      const allOrgs = await tx.select().from(organizations);
      console.log(`[SEED] Toplam ${allOrgs.length} organizasyon bulundu.`);

      // 2. Her organizasyon için varsayılan kural kontrolü ve tohumlama
      for (const org of allOrgs) {
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

      // 3. 🛡️ [Aşama 8.3] Eski Bekleyen Davetlerin (Legacy Data) Canlıdan Çekilip Aynalanması
      console.log("[SEED] 🔄 Clerk üzerindeki eski bekleyen davetler taranıyor...");
      
      const orgInvPromises = allOrgs.map(org =>
        client.organizations.getOrganizationInvitationList({
          organizationId: org.id,
          status: ["pending"]
        }).catch(err => {
          console.error(`[SEED] Organizasyon (${org.id}) davetleri çekilirken hata:`, err);
          return { data: [] };
        })
      );

      const [globalInvitations, orgInvitationsResults] = await Promise.all([
        client.invitations.getInvitationList({ status: "pending" }),
        Promise.all(orgInvPromises)
      ]);

      const invitationsToMirror: Array<{ id: string; email: string; organizationId: string | null; createdAt: Date }> = [];

      // A. Küresel davetleri ekle
      globalInvitations.data.forEach(inv => {
        invitationsToMirror.push({
          id: inv.id,
          email: inv.emailAddress.toLowerCase(),
          organizationId: null,
          createdAt: new Date(inv.createdAt)
        });
      });

      // B. Organizasyonel davetleri ekle
      orgInvitationsResults.forEach((result, idx) => {
        const orgId = allOrgs[idx].id;
        result.data.forEach(inv => {
          invitationsToMirror.push({
            id: inv.id,
            email: inv.emailAddress.toLowerCase(),
            organizationId: orgId,
            createdAt: new Date(inv.createdAt)
          });
        });
      });

      console.log(`[SEED] 📩 Toplam ${invitationsToMirror.length} bekleyen davet yerel veritabanına kopyalanıyor...`);

      for (const inv of invitationsToMirror) {
        await tx
          .insert(pendingInvitations)
          .values({
            id: inv.id,
            email: inv.email,
            organizationId: inv.organizationId,
            createdAt: inv.createdAt
          })
          .onConflictDoNothing();
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
