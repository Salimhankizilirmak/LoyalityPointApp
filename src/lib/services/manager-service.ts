import { BaseService } from "./base-service";
import { staffProfiles, branches } from "@/db/schema";
import { eq } from "drizzle-orm";

export class ManagerService extends BaseService {
  async getMyBranchData() {
    const { userId } = await this.getSession();
    const dbUser = await this.getLocalUser(userId!);
    if (!dbUser) throw new Error("Kullanıcı kaydı bulunamadı.");

    const staffProfile = await this.db.select().from(staffProfiles).where(eq(staffProfiles.userId, dbUser.id)).get();
    if (!staffProfile) throw new Error("Bir şubeye bağlı değilsiniz.");

    const branch = await this.db.select().from(branches).where(eq(branches.id, staffProfile.branchId)).get();
    if (!branch) throw new Error("Şube kaydı bulunamadı.");
    
    return {
      branchName: branch.name,
      orgId: branch.orgId,
      branchId: branch.id,
      role: dbUser.role.toLowerCase()
    };
  }

  async getStoreSettings() {
    const { loyaltyRules } = await import("@/db/schema");
    const data = await this.getMyBranchData();
    const rule = await this.db.select().from(loyaltyRules).where(eq(loyaltyRules.organizationId, data.orgId)).get();
    
    return {
      pointsEquivalent: rule?.pointsEquivalent ?? 1,
      tlEquivalent: rule?.tlEquivalent ?? 1,
      earnRatio: rule?.earnRatio ?? 10
    };
  }

  async updateStoreSettings(pointsEquivalent: number, tlEquivalent: number) {
    const { loyaltyRules } = await import("@/db/schema");
    const { purgeCacheTag, CACHE_TAGS } = await import("@/lib/cache-registry");
    const data = await this.getMyBranchData();

    await this.db
      .insert(loyaltyRules)
      .values({ organizationId: data.orgId, pointsEquivalent, tlEquivalent, earnRatio: 10 })
      .onConflictDoUpdate({
        target: loyaltyRules.organizationId,
        set: { pointsEquivalent, tlEquivalent },
      });

    // Önbellek geçersiz kılma (Bu ayarlar Boss profil önbelleğine bağlı)
    purgeCacheTag(CACHE_TAGS.bossProfile(data.orgId));
    
    return { success: true };
  }
}

export const managerService = new ManagerService();
