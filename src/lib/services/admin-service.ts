import { BaseService } from "./base-service";
import * as schema from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const { organizations, staffProfiles, customerProfiles, pointsTransactions, users, branches } = schema;

export class AdminService extends BaseService {
  async inviteBoss(companyName: string, bossEmail: string, appUrl: string): Promise<{ success: boolean; scenario: "NEW_BOSS" | "EXISTING_BOSS"; message: string }> {
    await this.requireRole(["SUPER_ADMIN"]);

    if (!companyName?.trim()) {
      throw new Error("Şirket adı boş olamaz.");
    }
    if (!bossEmail?.trim() || !bossEmail.includes("@")) {
      throw new Error("Geçerli bir e-posta adresi girilmelidir.");
    }

    const emailLower = bossEmail.trim().toLowerCase();
    const client = await this.getClerkClient();

    // 1. Yerel veritabanında kullanıcıyı sorgula
    const existingUser = await this.db.select().from(users).where(eq(users.email, emailLower)).get();

    if (existingUser) {
      if (existingUser.role === "SUPER_ADMIN") {
        throw new Error("Süper Admin bir şirkete patron olarak atanamaz.");
      }
      if (existingUser.role !== "BOSS") {
        throw new Error("Bu e-posta adresi platformda farklı bir rol ile kayıtlıdır.");
      }

      // SENARYO B (Mevcut Patron - Doğrudan Senkronizasyon)
      try {
        const clerkOrg = await client.organizations.createOrganization({
          name: companyName,
          createdBy: existingUser.clerkId,
        });

        await this.db.insert(organizations).values({
          id: clerkOrg.id,
          name: companyName,
          bossId: existingUser.id,
          bossEmail: null,
          branchLimit: 1,
          isActive: true,
        });

        revalidatePath("/admin");

        return {
          success: true,
          scenario: "EXISTING_BOSS",
          message: "Mevcut patrona yeni şirket başarıyla tanımlandı, davet mailine gerek kalmadı.",
        };
      } catch (error: unknown) {
        console.error("[AdminService] Scenario B failed:", error);
        throw new Error(error instanceof Error ? error.message : "Mevcut patrona organizasyon tanımlanırken bir hata oluştu.");
      }
    }

    // SENARYO A (Yeni Patron - Simetrik Kiracı Kurulumu)
    try {
      // 1. Clerk üzerinde organizasyonu peşin olarak oluştur
      const clerkOrg = await client.organizations.createOrganization({
        name: companyName,
      });

      // 2. Askıda organizasyon kaydını veritabanında oluştur (bossId = null)
      await this.db.insert(organizations).values({
        id: clerkOrg.id,
        name: companyName,
        bossId: null as unknown as string,
        bossEmail: emailLower,
        branchLimit: 1,
        isActive: true,
      });

      // 3. Kullanıcıya doğrudan kurumsal organizasyon yönetici daveti fırlat
      const clerkInv = await client.organizations.createOrganizationInvitation({
        organizationId: clerkOrg.id,
        emailAddress: emailLower,
        role: "org:admin",
        redirectUrl: `${appUrl}/sign-up`,
        publicMetadata: { role: "boss" },
      });

      console.log(`[AdminService] 📩 Invitation ${clerkInv.id} created successfully for ${emailLower}`);

      revalidatePath("/admin");

      return {
        success: true,
        scenario: "NEW_BOSS",
        message: "Yeni şirket aktif olabilmesi için patronun gönderilen e-postasını onaylaması gerekiyor.",
      };
    } catch (error: unknown) {
      console.error("[AdminService] Scenario A failed:", error);
      throw new Error(error instanceof Error ? error.message : "Yeni patron daveti gönderilirken bir hata oluştu.");
    }
  }

  async toggleOrgStatus(orgId: string, currentStatus: boolean) {
    await this.requireRole(["SUPER_ADMIN"]);
    await this.db.update(organizations).set({ isActive: !currentStatus }).where(eq(organizations.id, orgId));
    revalidatePath("/admin");
    return { success: true };
  }

  async updateBranchLimit(orgId: string, newLimit: number) {
    await this.requireRole(["SUPER_ADMIN"]);
    if (newLimit < 1) throw new Error("Şube limiti 1'den küçük olamaz.");

    const activeBranches = await this.db.select({ count: sql<number>`COUNT(*)` })
      .from(branches)
      .where(eq(branches.orgId, orgId))
      .get();
    
    const currentCount = activeBranches?.count ?? 0;

    if (newLimit < currentCount) {
      throw new Error(`Yeni limit, mevcut aktif şube sayısından (${currentCount}) daha az olamaz.`);
    }

    await this.db.update(organizations).set({ branchLimit: newLimit }).where(eq(organizations.id, orgId));
    revalidatePath("/admin");
    return { success: true };
  }

  async revokeBossInvitation(invitationId: string, organizationId?: string) {
    await this.requireRole(["SUPER_ADMIN"]);
    const client = await this.getClerkClient();
    
    if (organizationId) {
      console.log(`[AdminService] Revoking organization invitation: InvId=${invitationId}, OrgId=${organizationId}`);
      await client.organizations.revokeOrganizationInvitation({
        organizationId,
        invitationId,
      });
    } else {
      console.log(`[AdminService] Revoking global user invitation: InvId=${invitationId}`);
      await client.invitations.revokeInvitation(invitationId);
    }
    
    revalidatePath("/admin");
    return { success: true };
  }

  async getAllOrganizations() {
    await this.requireRole(["SUPER_ADMIN"]);
    const client = await this.getClerkClient();
    
    const clerkOrgs = await client.organizations.getOrganizationList({ limit: 100 });
    const clerkOrgIds = new Set(clerkOrgs.data.map(o => o.id));

    const localOrgs = await this.db.select({ id: organizations.id }).from(organizations).all();

    const ghostOrgs = localOrgs.filter(o => !clerkOrgIds.has(o.id));
    if (ghostOrgs.length > 0) {
      console.log(`[AdminService] 🧹 Cleaning up ${ghostOrgs.length} ghost organizations from DB.`);
      const { inArray } = await import("drizzle-orm");
      await this.db.delete(organizations).where(inArray(organizations.id, ghostOrgs.map(g => g.id)));
    }
    
    const orgs = await this.db.select({
      id: organizations.id,
      name: organizations.name,
      bossId: organizations.bossId,
      isActive: organizations.isActive,
      createdAt: organizations.createdAt,
      branchLimit: organizations.branchLimit,
      branchCount: sql<number>`(SELECT COUNT(*) FROM ${branches} WHERE ${branches.orgId} = ${organizations.id})`,
      managerCount: sql<number>`(
        SELECT COUNT(*) FROM ${staffProfiles} 
        INNER JOIN ${branches} ON ${staffProfiles.branchId} = ${branches.id}
        INNER JOIN ${users} ON ${staffProfiles.userId} = ${users.id}
        WHERE ${branches.orgId} = ${organizations.id} AND ${users.role} = 'MANAGER'
      )`,
      customerCount: sql<number>`(SELECT COUNT(*) FROM ${customerProfiles} WHERE ${customerProfiles.orgId} = ${organizations.id})`,
      totalVolume: sql<number>`(
        SELECT COALESCE(SUM(amount), 0) FROM ${pointsTransactions} 
        INNER JOIN ${customerProfiles} ON ${pointsTransactions.customerProfileId} = ${customerProfiles.id}
        WHERE ${customerProfiles.orgId} = ${organizations.id}
      )`,
    }).from(organizations).all();

    const bosses = await this.db.select({ id: users.id, email: users.email }).from(users).all();
    const bossesMap = new Map(bosses.map(b => [b.id, b.email]));

    return orgs.map(o => ({
      id: o.id,
      name: o.name,
      bossEmail: (o.bossId && bossesMap.get(o.bossId)) || "Bilinmiyor",
      isActive: o.isActive,
      createdAt: o.createdAt,
      branchLimit: o.branchLimit,
      branchCount: o.branchCount,
      managerCount: o.managerCount,
      customerCount: o.customerCount,
      totalVolume: o.totalVolume,
    }));
  }

  async getGlobalAnalytics() {
    await this.requireRole(["SUPER_ADMIN"]);

    const [stats] = await this.db.select({
      totalOrgs: sql<number>`COUNT(DISTINCT ${organizations.id})`,
      activeOrgs: sql<number>`COUNT(CASE WHEN ${organizations.isActive} = 1 THEN 1 END)`,
      totalStaff: sql<number>`(SELECT COUNT(*) FROM ${staffProfiles})`,
      totalCustomers: sql<number>`(SELECT COUNT(*) FROM ${customerProfiles})`,
      totalVolume: sql<number>`(SELECT COALESCE(SUM(amount), 0) FROM ${pointsTransactions})`,
    }).from(organizations).all();

    const orgComparison = await this.db.select({
      name: organizations.name,
      volume: sql<number>`(
        SELECT COALESCE(SUM(amount), 0) FROM ${pointsTransactions}
        INNER JOIN ${customerProfiles} ON ${pointsTransactions.customerProfileId} = ${customerProfiles.id}
        WHERE ${customerProfiles.orgId} = ${organizations.id}
      )`,
      customers: sql<number>`(
        SELECT COUNT(*) FROM ${customerProfiles}
        WHERE ${customerProfiles.orgId} = ${organizations.id}
      )`,
    })
    .from(organizations)
    .orderBy(desc(sql`(
      SELECT COALESCE(SUM(amount), 0) FROM ${pointsTransactions}
      INNER JOIN ${customerProfiles} ON ${pointsTransactions.customerProfileId} = ${customerProfiles.id}
      WHERE ${customerProfiles.orgId} = ${organizations.id}
    )`))
    .limit(5)
    .all();

    const monthlyTrend = await this.db.select({
      month: sql<string>`strftime('%Y-%m', created_at, 'unixepoch')`,
      volume: sql<number>`SUM(amount)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(pointsTransactions)
    .groupBy(sql`month`)
    .orderBy(desc(sql`month`))
    .limit(6)
    .all();

    return {
      stats: {
        totalOrgs: stats.totalOrgs || 0,
        activeOrgs: stats.activeOrgs || 0,
        totalStaff: stats.totalStaff || 0,
        totalCustomers: stats.totalCustomers || 0,
        totalVolume: stats.totalVolume || 0,
      },
      orgComparison: orgComparison.map(o => ({
        name: o.name.length > 15 ? o.name.substring(0, 12) + "..." : o.name,
        volume: Number(o.volume) / 100, 
        customers: Number(o.customers)
      })),
      monthlyTrend: monthlyTrend.reverse().map(t => ({
        month: t.month || new Date().toISOString().substring(0, 7),
        volume: Number(t.volume) / 100,
        count: Number(t.count)
      }))
    };
  }

  async getInvitedBosses() {
    await this.requireRole(["SUPER_ADMIN"]);
    const client = await this.getClerkClient();
    
    // 1. Yerel aktif BOSS'ları çek
    const localBosses = await this.db.select({
      id: users.id,
      clerkId: users.clerkId,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "BOSS"))
    .all();

    // 2. Yerel organizasyonları çek
    const localOrgs = await this.db.select({ id: organizations.id }).from(organizations).all();

    // 3. Her organizasyon için bekleyen Clerk davetiyelerini paralel çek
    const pendingPromises = localOrgs.map(org =>
      client.organizations.getOrganizationInvitationList({
        organizationId: org.id,
        status: ["pending"]
      }).catch((err) => {
        console.error(`[AdminService] Davetiyeler çekilirken hata (Org: ${org.id}):`, err);
        return { data: [] };
      })
    );

    const pendingResults = await Promise.all(pendingPromises);
    const pending: Array<{ id: string; email: string; status: "pending"; createdAt: number; organizationId?: string }> = [];

    localOrgs.forEach((org, idx) => {
      const res = pendingResults[idx];
      res.data.forEach(inv => {
        pending.push({
          id: inv.id,
          email: inv.emailAddress.toLowerCase(),
          status: "pending",
          createdAt: new Date(inv.createdAt).getTime(),
          organizationId: org.id,
        });
      });
    });

    const active = localBosses.map(u => ({
      id: u.id,
      email: u.email,
      status: "accepted" as const,
      createdAt: u.createdAt ? new Date(u.createdAt).getTime() : Date.now(),
      lastSignIn: Date.now(),
    }));

    return [...pending, ...active].sort((a, b) => b.createdAt - a.createdAt);
  }
}

export const adminService = new AdminService();
