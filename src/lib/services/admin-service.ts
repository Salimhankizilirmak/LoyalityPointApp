import { BaseService } from "./base-service";
import { organizations, staff, pointsTransactions, customers } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export class AdminService extends BaseService {
  async inviteBoss(email: string, appUrl: string) {
    await this.requireRole(["superadmin"]);
    const client = await this.getClerkClient();

    try {
      const existingUsers = await client.users.getUserList({ emailAddress: [email] });
      if (existingUsers.data.some(u => (u.publicMetadata as { role?: string })?.role === "boss")) {
        throw new Error("Bu e-posta adresiyle zaten sisteme kayıtlı bir patron var.");
      }

      await client.invitations.createInvitation({
        emailAddress: email,
        publicMetadata: { role: "boss" },
        redirectUrl: `${appUrl}/sign-up`,
      });
      revalidatePath("/admin");

      // 60 saniye kuralı, kullanıcının maili açıp şifre belirlemesi için çok kısa olduğundan
      // (ve kayıt esnasında linkin geçersiz olmasına sebep olduğundan) kaldırıldı.
      // İptal işlemleri manuel olarak arayüzden yapılabilir.

      return { success: true, message: `${email} adresine Patron daveti gönderildi!` };
    } catch (error: unknown) {
      const clerkError = error as { errors?: { code: string }[] };
      if (clerkError.errors?.[0]?.code === "duplicate_record") {
        throw new Error("Bu e-posta adresine zaten aktif bir davet gönderilmiş.");
      }
      throw error;
    }
  }

  async toggleOrgStatus(orgId: string, currentStatus: boolean) {
    await this.requireRole(["superadmin"]);
    await this.db.update(organizations).set({ isActive: !currentStatus }).where(eq(organizations.id, orgId));
    revalidatePath("/admin");
    return { success: true };
  }

  async revokeBossInvitation(invitationId: string) {
    await this.requireRole(["superadmin"]);
    const client = await this.getClerkClient();
    await client.invitations.revokeInvitation(invitationId);
    revalidatePath("/admin");
    return { success: true };
  }

  async getAllOrganizations() {
    await this.requireRole(["superadmin"]);
    const client = await this.getClerkClient();
    
    // 1. Clerk'teki tüm aktif organizasyonları çek (Senkronizasyon için)
    // Eğer pagination gerekirse, limit: 100 artırılabilir veya döngüye alınabilir.
    const clerkOrgs = await client.organizations.getOrganizationList({ limit: 100 });
    const clerkOrgIds = new Set(clerkOrgs.data.map(o => o.id));

    // 2. Turso'daki tüm organizasyonları çek
    const localOrgs = await this.db.select({ id: organizations.id }).from(organizations).all();

    // 3. Senkronizasyon (Clerk'te olmayanları DB'den sil)
    const ghostOrgs = localOrgs.filter(o => !clerkOrgIds.has(o.id));
    if (ghostOrgs.length > 0) {
      console.log(`[AdminService] 🧹 Cleaning up ${ghostOrgs.length} ghost organizations from DB.`);
      const { inArray } = await import("drizzle-orm");
      await this.db.delete(organizations).where(inArray(organizations.id, ghostOrgs.map(g => g.id)));
    }
    
    // 4. Zenginleştirilmiş veri çek: Şube sayısı, çalışan sayısı ve işlem hacmi ile birlikte
    const orgs = await this.db.select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      bossEmail: organizations.bossEmail,
      isActive: organizations.isActive,
      createdAt: organizations.createdAt,
      branchCount: sql<number>`(SELECT COUNT(*) FROM ${staff} WHERE ${staff.orgId} = ${organizations.id})`,
      managerCount: sql<number>`(SELECT COUNT(*) FROM ${staff} WHERE ${staff.orgId} = ${organizations.id} AND ${staff.role} = 'manager')`,
      customerCount: sql<number>`(SELECT COUNT(DISTINCT customer_id) FROM ${pointsTransactions} WHERE ${pointsTransactions.orgId} = ${organizations.id})`,
      totalVolume: sql<number>`(SELECT COALESCE(SUM(amount), 0) FROM ${pointsTransactions} WHERE ${pointsTransactions.orgId} = ${organizations.id})`,
    }).from(organizations).all();

    return orgs;
  }

  async getGlobalAnalytics() {
    await this.requireRole(["superadmin"]);

    // 1. Genel Metrikler
    const [stats] = await this.db.select({
      totalOrgs: sql<number>`COUNT(DISTINCT ${organizations.id})`,
      activeOrgs: sql<number>`COUNT(CASE WHEN ${organizations.isActive} = 1 THEN 1 END)`,
      totalStaff: sql<number>`(SELECT COUNT(*) FROM ${staff})`,
      totalCustomers: sql<number>`(SELECT COUNT(*) FROM ${customers})`,
      totalVolume: sql<number>`(SELECT COALESCE(SUM(amount), 0) FROM ${pointsTransactions})`,
    }).from(organizations).all();

    // 2. Organizasyon Bazlı Karşılaştırma (Top 5 Hacim)
    const orgComparison = await this.db.select({
      name: organizations.name,
      volume: sql<number>`(SELECT COALESCE(SUM(amount), 0) FROM ${pointsTransactions} WHERE ${pointsTransactions.orgId} = ${organizations.id})`,
      customers: sql<number>`(SELECT COUNT(DISTINCT customer_id) FROM ${pointsTransactions} WHERE ${pointsTransactions.orgId} = ${organizations.id})`,
    })
    .from(organizations)
    .orderBy(desc(sql`(SELECT COALESCE(SUM(amount), 0) FROM ${pointsTransactions} WHERE ${pointsTransactions.orgId} = ${organizations.id})`))
    .limit(5)
    .all();

    // 3. Son 6 Ay İşlem Trendi
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
        volume: Number(o.volume) / 100, // Kuruş -> Birim
        customers: Number(o.customers)
      })),
      monthlyTrend: monthlyTrend.reverse().map(t => ({
        month: t.month,
        volume: Number(t.volume) / 100,
        count: Number(t.count)
      }))
    };
  }

  async getInvitedBosses() {
    await this.requireRole(["superadmin"]);
    const client = await this.getClerkClient();
    
    const [invitations, users] = await Promise.all([
      client.invitations.getInvitationList({ status: "pending" }),
      client.users.getUserList({ limit: 100 })
    ]);

    const bossUsers = users.data.filter(u => (u.publicMetadata as { role?: string })?.role === "boss");

    const activeEmails = new Set(bossUsers.map(u => u.emailAddresses[0]?.emailAddress).filter(Boolean));

    const pending = invitations.data
      .filter(inv => !activeEmails.has(inv.emailAddress)) // Eğer user oluşturulduysa pending listesinde gösterme
      .map(inv => ({
        id: inv.id,
        email: inv.emailAddress,
        status: "pending" as const,
        createdAt: inv.createdAt,
      }));

    const active = bossUsers.map(u => ({
      id: u.id,
      email: u.emailAddresses[0]?.emailAddress || "",
      status: "accepted" as const,
      createdAt: u.createdAt,
      lastSignIn: u.lastSignInAt,
    }));

    return [...pending, ...active].sort((a, b) => b.createdAt - a.createdAt);
  }
}

export const adminService = new AdminService();
