import { BaseService } from "./base-service";
import { organizations, branches, loyaltyRules } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath, unstable_cache, unstable_noStore } from "next/cache";
import { CACHE_TAGS, purgeCacheTag } from "@/lib/cache-registry";
import { db } from "@/db";
import { nanoid } from "nanoid";

// Önbellek yardımcı fonksiyonları
const getCachedOrgProfileDetails = (orgId: string) => unstable_cache(
  async (id: string) => {
    const [dbOrg, branchCountResult, loyaltyRule] = await Promise.all([
      db.select().from(organizations).where(eq(organizations.id, id)).get(),
      db.select({ count: sql<number>`COUNT(*)` }).from(branches).where(eq(branches.orgId, id)).get(),
      db.select().from(loyaltyRules).where(eq(loyaltyRules.organizationId, id)).get(),
    ]);
    return {
      dbOrg,
      branchCount: branchCountResult?.count ?? 0,
      earnRatio: loyaltyRule?.earnRatio ?? 10,
      pointsEquivalent: loyaltyRule?.pointsEquivalent ?? 1,
      tlEquivalent: loyaltyRule?.tlEquivalent ?? 1,
    };
  },
  [`org-profile-details-${orgId}`],
  {
    tags: [CACHE_TAGS.bossProfile(orgId)],
  }
);

const getCachedOrgBranches = (orgId: string) => unstable_cache(
  async (id: string) => {
    return await db.select().from(branches).where(eq(branches.orgId, id)).all();
  },
  [`org-branches-list-${orgId}`],
  {
    tags: [CACHE_TAGS.bossBranches(orgId)],
  }
);

export class OrganizationService extends BaseService {
  async getAllBossOrganizations() {
    unstable_noStore();
    const { dbUser } = await this.requireRole(["BOSS", "SUPER_ADMIN"]);
    return await this.db.select().from(organizations).where(eq(organizations.bossId, dbUser.id)).all();
  }

  async getBossProfile() {
    unstable_noStore();
    const user = await this.getCurrentUser();
    let orgData = null;
    let allOrgs: { id: string; name: string }[] = [];

    const dbUser = await this.getLocalUser(user.id);
    if (dbUser && dbUser.role === "BOSS") {
      // BOSS'un sahip olduğu tüm organizasyonlar
      allOrgs = await this.db.select({
        id: organizations.id,
        name: organizations.name
      }).from(organizations).where(eq(organizations.bossId, dbUser.id)).all();
    }

    let orgId = null;
    try {
      orgId = await this.requireOrg();
    } catch (err) {
      console.warn("[getBossProfile] Failed to resolve orgId:", err);
    }

    if (orgId) {
      const client = await this.getClerkClient();
      let orgName = "Organizasyon";
      let orgSlug = "";
      
      try {
        const org = await client.organizations.getOrganization({ organizationId: orgId });
        orgName = org.name;
        orgSlug = org.slug || "";
      } catch (err) {
        console.warn("[getBossProfile] Failed to fetch organization from Clerk:", err);
      }

      // Detaylar cached fonksiyondan getirilir
      const { dbOrg, branchCount, earnRatio, pointsEquivalent, tlEquivalent } = await getCachedOrgProfileDetails(orgId)(orgId);

      if (!dbOrg) {
        // Webhook gecikmesi veya senkronizasyon kopukluğu: sistemi patlatma,
        // güvenli fallback objesi üret. Kullanıcı yenilediğinde gerçek veri gelir.
        console.warn(
          `[getBossProfile] ⚠️ Org ${orgId} not found in local DB. Returning safe fallback. Webhook may be delayed.`
        );
        orgData = {
          id: orgId,
          name: orgName,
          slug: orgSlug,
          pointRate: 10,
          pointsEquivalent: 1,
          tlEquivalent: 1,
          validityMonths: 12,
          branchLimit: 3,
          currentBranches: 0,
        };
      } else {
        orgData = {
          id: orgId,
          name: dbOrg.name || orgName,
          slug: orgSlug,
          pointRate: earnRatio,
          pointsEquivalent: pointsEquivalent,
          tlEquivalent: tlEquivalent,
          validityMonths: 12,
          branchLimit: dbOrg.branchLimit ?? 2,
          currentBranches: branchCount,
        };
      }
    }

    return {
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses[0]?.emailAddress || "",
        imageUrl: user.imageUrl,
        username: dbUser?.username || null,
      },
      org: orgData,
      allOrgs,
    };
  }

  async createOrganization(name: string, slug: string) {
    const { dbUser } = await this.requireRole(["BOSS", "SUPER_ADMIN"]);
    const client = await this.getClerkClient();

    const existingOrgs = await this.db.select().from(organizations).where(eq(organizations.bossId, dbUser.id)).all();
    if (existingOrgs.length >= 1) {
      throw new Error("Sadece 1 adet organizasyon kurabilirsiniz.");
    }

    const org = await client.organizations.createOrganization({ name, slug, createdBy: dbUser.clerkId });
    
    await this.db.insert(organizations).values({
      id: org.id,
      name,
      bossId: dbUser.id,
      registrationCode: nanoid(10),
      branchLimit: 2,
      isActive: true,
    });

    revalidatePath("/dashboard");
    return { success: true, id: org.id };
  }

  async createBranch(name: string, city: string) {
    await this.requireRole(["BOSS", "SUPER_ADMIN"]);
    const orgId = await this.requireOrg();

    return await this.db.transaction(async (tx) => {
      const existing = await tx.select().from(organizations).where(eq(organizations.id, orgId)).get();
      if (!existing) {
        throw new Error("Bu organizasyon sistemde aktif değil veya onaylanmamış. Lütfen Sistem Yöneticisi ile iletişime geçin.");
      }

      const activeBranches = await tx.select({ count: sql<number>`COUNT(*)` })
        .from(branches)
        .where(eq(branches.orgId, orgId))
        .get();
      
      const currentCount = activeBranches?.count ?? 0;
      const limit = existing.branchLimit;

      if (currentCount >= limit) {
        throw new Error(`Şube oluşturma limitine ulaştınız (Limit: ${limit}, Mevcut: ${currentCount}). Daha fazla şube eklemek için lütfen yöneticinizle iletişime geçin.`);
      }

      const duplicate = await tx.select()
        .from(branches)
        .where(and(
          eq(branches.orgId, orgId),
          eq(branches.name, name),
          eq(branches.city, city)
        ))
        .get();
      
      if (duplicate) {
        throw new Error(`Bu şehirde (${city}) "${name}" isimli bir şube zaten mevcut.`);
      }

      const [newBranch] = await tx.insert(branches).values({
        orgId,
        name,
        city,
        isActive: true,
      }).returning();

      // Önbellek geçersiz kılma
      purgeCacheTag(CACHE_TAGS.bossBranches(orgId));
      purgeCacheTag(CACHE_TAGS.bossProfile(orgId));

      revalidatePath("/boss-dashboard");
      return { success: true, id: newBranch.id, name, city };
    });
  }

  async updateSettings(pointRate: number, validityMonths: number, pointsEquivalent: number = 1, tlEquivalent: number = 1) {
    const orgId = await this.requireOrg();
    
    await this.db
      .insert(loyaltyRules)
      .values({ organizationId: orgId, earnRatio: pointRate, pointsEquivalent, tlEquivalent })
      .onConflictDoUpdate({
        target: loyaltyRules.organizationId,
        set: { earnRatio: pointRate, pointsEquivalent, tlEquivalent },
      });

    // Önbellek geçersiz kılma
    purgeCacheTag(CACHE_TAGS.bossProfile(orgId));

    return { success: true };
  }

  async getBranches() {
    await this.requireRole(["BOSS", "SUPER_ADMIN"]);
    const orgId = await this.requireOrg();
    return await getCachedOrgBranches(orgId)(orgId);
  }

  async updateName(newName: string) {
    const orgId = await this.requireOrg();
    const { dbUser } = await this.requireRole(["BOSS", "SUPER_ADMIN"]);
    
    const client = await this.getClerkClient();
    await Promise.all([
      client.organizations.updateOrganization(orgId, { name: newName }),
      this.db.update(organizations).set({ name: newName }).where(eq(organizations.id, orgId))
    ]);

    // Önbellek geçersiz kılma
    purgeCacheTag(CACHE_TAGS.bossProfile(orgId));
    purgeCacheTag(CACHE_TAGS.userOwnership(dbUser.id));

    return { success: true };
  }

  async deleteOrganization(id: string) {
    await this.requireRole(["BOSS", "SUPER_ADMIN"]);
    const client = await this.getClerkClient();
    
    const org = await this.db.select().from(organizations).where(eq(organizations.id, id)).get();

    try {
      await client.organizations.deleteOrganization(id);
    } catch (error: unknown) {
      const err = error as { status?: number; code?: string };
      if (err.status === 404 || err.code === 'resource_not_found') {
        console.warn(`[OrganizationService] 🧹 Org already gone from Clerk: ${id}`);
      } else {
        throw error;
      }
    }

    await this.db.delete(organizations).where(eq(organizations.id, id));
    
    // Önbellek geçersiz kılma
    purgeCacheTag(CACHE_TAGS.bossProfile(id));
    if (org && org.bossId) {
      purgeCacheTag(CACHE_TAGS.userOwnership(org.bossId));
    }

    revalidatePath("/boss-dashboard");
    revalidatePath("/admin");
    return { success: true };
  }

  async deleteBranch(id: string) {
    await this.requireRole(["BOSS", "SUPER_ADMIN"]);
    const session = await (await import("@clerk/nextjs/server")).auth();
    const orgId = await this.requireOrg();
    const client = await this.getClerkClient();
    
    if (orgId) {
      try {
        const invitations = await client.invitations.getInvitationList({ status: "pending" });
        const branchInvites = invitations.data.filter(inv => 
          inv.publicMetadata?.branch_id === id || inv.publicMetadata?.org_id === orgId && inv.publicMetadata?.branch_id === id
        );

        for (const invite of branchInvites) {
          try {
            await client.organizations.revokeOrganizationInvitation({
              organizationId: orgId,
              invitationId: invite.id,
              requestingUserId: session.userId!
            });
            console.log(`[OrganizationService] 🚫 Revoked invite for deleted branch: ${invite.emailAddress}`);
          } catch (e) {
            console.error(`[OrganizationService] Failed to revoke invite ${invite.id}:`, e);
          }
        }
      } catch (error) {
        console.error("[OrganizationService] Error during branch invite cleanup:", error);
      }
    }

    await this.db.delete(branches).where(eq(branches.id, id));
    
    // Önbellek geçersiz kılma
    purgeCacheTag(CACHE_TAGS.bossBranches(orgId));
    purgeCacheTag(CACHE_TAGS.bossProfile(orgId));

    revalidatePath("/boss-dashboard");
    return { success: true };
  }

  async toggleStatus(id: string) {
    await this.requireRole(["BOSS", "SUPER_ADMIN"]);
    const orgId = await this.requireOrg();
    const branch = await this.db.select().from(branches).where(eq(branches.id, id)).get();
    if (!branch) throw new Error("Şube bulunamadı.");

    await this.db.update(branches)
      .set({ isActive: !branch.isActive })
      .where(eq(branches.id, id));

    // Önbellek geçersiz kılma
    purgeCacheTag(CACHE_TAGS.bossBranches(orgId));

    revalidatePath("/boss-dashboard");
    return { success: true, newState: !branch.isActive };
  }

  async getDbOrg(id: string) {
    return await this.db.select().from(organizations).where(eq(organizations.id, id)).get();
  }
}

export const organizationService = new OrganizationService();
