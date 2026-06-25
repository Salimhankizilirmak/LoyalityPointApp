import { BaseService } from "./base-service";
import * as schema from "@/db/schema";
import { eq, sql, desc, or, lt, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { normalizePhoneToUsername, sanitizePhoneTo10 } from "@/lib/utils";

const { organizations, staffProfiles, customerProfiles, pointsTransactions, users, branches, invitations } = schema;

export class AdminService extends BaseService {
  async inviteBoss(companyName: string, bossEmail: string, appUrl: string, bossPhone: string): Promise<{ success: boolean; scenario: "NEW_BOSS" | "EXISTING_BOSS" | "DUPLICATE_INVITATION"; message: string }> {
    const { dbUser } = await this.requireRole(["SUPER_ADMIN"]);

    if (!companyName?.trim()) {
      throw new Error("Şirket adı boş olamaz.");
    }
    if (!bossEmail?.trim() || !bossEmail.includes("@")) {
      throw new Error("Geçerli bir e-posta adresi girilmelidir.");
    }

    // Telefon numarasını temizle ve doğrula
    const cleanedPhone = sanitizePhoneTo10(bossPhone);
    if (!/^5\d{9}$/.test(cleanedPhone)) {
      throw new Error("Geçersiz telefon numarası formatı. Telefon numarası 5 ile başlamalı ve 10 haneli olmalıdır.");
    }
    const normalizedPhone = normalizePhoneToUsername(bossPhone); // Clerk için eski formatı koruyoruz

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
          bossEmail: emailLower,
          branchLimit: 1,
          isActive: true,
          status: "ACTIVE",
        });

        revalidatePath("/admin");

        return {
          success: true,
          scenario: "EXISTING_BOSS",
          message: "Mevcut patrona yeni şirket başarıyla tanımlandı, davet mailine gerek kalmadı.",
        };
      } catch (error: unknown) {
        console.error("[AdminService] Scenario B failed:", error);

        // Check for organization_creator_not_found error (manual user deletion in Clerk)
        const isCreatorNotFound =
          (error && typeof error === "object" && "errors" in error && Array.isArray((error as Record<string, unknown>).errors) && ((error as Record<string, unknown>).errors as Record<string, unknown>[]).some((e) => e?.code === "organization_creator_not_found")) ||
          JSON.stringify(error).includes("organization_creator_not_found") ||
          (error instanceof Error && error.message.includes("organization_creator_not_found"));

        if (isCreatorNotFound) {
          console.warn(`[AdminService] Stale user detected in DB (Clerk user not found). Self-healing fallback triggered for user clerkId: ${existingUser.clerkId}`);

          // Soft update stale user in local database
          await this.db.update(users)
            .set({
              clerkId: `stale_${existingUser.clerkId}`,
              email: `stale_${Date.now()}_${existingUser.email}`,
            })
            .where(eq(users.id, existingUser.id));
          console.log(`[AdminService] Stale user ${existingUser.clerkId} soft-updated in local DB.`);

          // Fall through to Scenario A (since we don't throw or return)
        } else {
          throw new Error(error instanceof Error ? error.message : "Mevcut patrona organizasyon tanımlanırken bir hata oluştu.");
        }
      }
    }

    // SENARYO A (Yeni Patron - Simetrik Kiracı Kurulumu)
    let clerkOrg: { id: string } | null = null;
    let localOrgCreated = false;
    let invitedViaFallback = false;
    let clerkInviteIdToSave = "";

    try {
      // 1. Clerk üzerinde organizasyonu peşin olarak oluştur
      clerkOrg = await client.organizations.createOrganization({
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
        status: "PENDING",
      });
      localOrgCreated = true;

      // ─── CLERK DAVETİ ─────────────────────────────────
      const clerkInv = await client.invitations.createInvitation({
        emailAddress: emailLower,
        publicMetadata: {
          orgId: clerkOrg.id,
          role: "boss",
          phone: normalizedPhone,
        },
        redirectUrl: `${appUrl}/sign-up`,
        ignoreExisting: true,
      });

      const { emailService } = await import("@/lib/services/email-service");
      const { getBossInvitationTemplate } = await import("@/lib/templates/email-templates");
      const text = `Merhaba, Topla Kazan platformu üzerinden ${companyName} bünyesinde "Firma Sahibi (Patron)" olarak kurumsal hesap aktivasyonunuzu tamamlamanız için bir davet aldınız. Aktivasyon için şu adresi ziyaret edin: ${clerkInv.url || ""}. Bu daveti onaylamanız, KVKK Aydınlatma Metni'ni kabul ettiğiniz anlamına gelir.`;
      const html = getBossInvitationTemplate(clerkInv.url || "", companyName);

      await emailService.sendMail({
        to: emailLower,
        subject: `${companyName} — Kurumsal Katılım ve Hesap Aktivasyon Daveti`,
        html,
        text,
      }).catch((err) => {
        console.error("[EmailService] Patron davet e-postası gönderim hatası:", err);
      });

      clerkInviteIdToSave = clerkInv.id;
      invitedViaFallback = false; // Rollback aşamasında revokeOrganizationInvitation çağrılması için false set edilir.

      // ─── 3. YEREL VERİTABANI GÖLGE KAYDI ─────────────────────────────────
      await this.db.insert(invitations).values({
        clerkInviteId: clerkInviteIdToSave,
        email: emailLower,
        phoneNumber: cleanedPhone, // 10 haneli ham string kaydediliyor
        organizationId: clerkOrg.id,
        role: "BOSS",
        status: "PENDING",
        invitedBy: dbUser.id,
      });

      console.log(`[AdminService] 📩 Invitation ${clerkInviteIdToSave} created and sent successfully to ${emailLower}`);

      revalidatePath("/admin");

      return {
        success: true,
        scenario: "NEW_BOSS",
        message: "Yeni şirket aktif olabilmesi için patronun gönderilen e-postasını onaylaması gerekiyor.",
      };
    } catch (error: unknown) {
      console.error("[AdminService] Scenario A failed, performing rollback:", error);

      // Rollback Clerk invitation
      if (clerkInviteIdToSave) {
        try {
          if (invitedViaFallback) {
            await client.invitations.revokeInvitation(clerkInviteIdToSave);
          } else if (clerkOrg) {
            await client.organizations.revokeOrganizationInvitation({
              organizationId: clerkOrg.id,
              invitationId: clerkInviteIdToSave,
            });
          }
          console.log(`[AdminService] 🔄 Rolled back Clerk invitation: ${clerkInviteIdToSave}`);
        } catch (revErr) {
          console.error("[AdminService] Failed to revoke Clerk invitation during rollback:", revErr);
        }
      }

      // Rollback local database organization record
      if (localOrgCreated && clerkOrg) {
        try {
          await this.db.delete(organizations).where(eq(organizations.id, clerkOrg.id));
          console.log(`[AdminService] 🔄 Rolled back local organization DB record: ${clerkOrg.id}`);
        } catch (dbErr) {
          console.error("[AdminService] Failed to delete local organization during rollback:", dbErr);
        }
      }

      // Rollback Clerk organization
      if (clerkOrg && clerkOrg.id) {
        try {
          await client.organizations.deleteOrganization(clerkOrg.id);
          console.log(`[AdminService] 🔄 Rolled back Clerk organization: ${clerkOrg.id}`);
        } catch (orgErr) {
          console.error("[AdminService] Failed to delete Clerk organization during rollback:", orgErr);
        }
      }

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
    
    // Yerel veritabanında davetiye durumunu REVOKED yap
    await this.db.update(invitations)
      .set({ status: "REVOKED" })
      .where(eq(invitations.clerkInviteId, invitationId));
    
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
    
    // 30 günü geçmiş veya süresi dolmuş PENDING davetiyeleri otomatik olarak EXPIRED yap
    const now = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    await this.db.update(invitations)
      .set({ status: "EXPIRED" })
      .where(
        and(
          eq(invitations.status, "PENDING"),
          or(
            lt(invitations.createdAt, thirtyDaysAgo),
            lt(invitations.expiresAt, now)
          )
        )
      );

    // Yerel davetiyeleri çek
    const localInvites = await this.db.select({
      id: invitations.id,
      clerkInviteId: invitations.clerkInviteId,
      email: invitations.email,
      status: invitations.status,
      createdAt: invitations.createdAt,
      organizationId: invitations.organizationId,
    })
    .from(invitations)
    .all();

    // BOSS kullanıcılarını çekerek lastSignIn (veya varsa son giriş) eşleştirmek için bir harita oluşturalım
    const activeBosses = await this.db.select({
      email: users.email,
    })
    .from(users)
    .where(eq(users.role, "BOSS"))
    .all();
    const activeBossEmails = new Set(activeBosses.map(b => b.email.toLowerCase()));

    return localInvites.map(inv => {
      let currentStatus = inv.status.toLowerCase() as "pending" | "accepted" | "revoked" | "expired";
      
      // Eğer kullanıcı yerel BOSS olarak eklenmişse durumu kabul edilmiş sayabiliriz
      if (activeBossEmails.has(inv.email.toLowerCase()) && currentStatus === "pending") {
        currentStatus = "accepted";
      }

      return {
        id: inv.clerkInviteId || inv.id,
        email: inv.email,
        status: currentStatus,
        createdAt: inv.createdAt ? new Date(inv.createdAt).getTime() : Date.now(),
        organizationId: inv.organizationId,
        ...(currentStatus === "accepted" ? { lastSignIn: Date.now() } : {})
      };
    }).sort((a, b) => b.createdAt - a.createdAt);
  }

  async transferCompanyOwnership(organizationId: string, newBossEmail: string): Promise<{ success: boolean; scenario: "NEW_BOSS" | "EXISTING_BOSS"; message: string }> {
    await this.requireRole(["SUPER_ADMIN"]);

    if (!organizationId?.trim()) {
      throw new Error("Organizasyon ID boş olamaz.");
    }
    if (!newBossEmail?.trim() || !newBossEmail.includes("@")) {
      throw new Error("Geçerli bir yeni patron e-posta adresi girilmelidir.");
    }

    const emailLower = newBossEmail.trim().toLowerCase();
    const client = await this.getClerkClient();

    // 1. Organizasyonu bul
    const org = await this.db.select().from(organizations).where(eq(organizations.id, organizationId)).get();
    if (!org) {
      throw new Error("Organizasyon bulunamadı.");
    }

    // 2. Eski patronun Clerk organizasyon üyeliğini kaldır ve metadata temizle
    if (org.bossId) {
      const oldBoss = await this.db.select().from(users).where(eq(users.id, org.bossId)).get();
      if (oldBoss) {
        try {
          await client.organizations.deleteOrganizationMembership({
            organizationId: organizationId,
            userId: oldBoss.clerkId,
          });
          console.log(`[AdminService] Sahiplik Devri: Eski patronun (${oldBoss.email}) Clerk üyeliği silindi.`);
        } catch (err) {
          console.warn(`[AdminService] Sahiplik Devri: Eski patron Clerk üyelik silme uyarısı:`, err);
        }

        try {
          await client.users.updateUserMetadata(oldBoss.clerkId, {
            publicMetadata: {
              role: null,
              orgId: null,
            }
          });
          console.log(`[AdminService] Sahiplik Devri: Eski patron metadata temizlendi.`);
        } catch (err) {
          console.warn(`[AdminService] Sahiplik Devri: Eski patron metadata temizleme hatası:`, err);
        }
      }
    }

    // 3. Yeni patron yerel veritabanında var mı sorgula
    const existingUser = await this.db.select().from(users).where(eq(users.email, emailLower)).get();

    if (existingUser) {
      if (existingUser.role === "SUPER_ADMIN") {
        throw new Error("Süper Admin bir şirkete patron olarak atanamaz.");
      }
      if (existingUser.role !== "BOSS") {
        throw new Error("Bu e-posta adresi platformda farklı bir rol ile kayıtlıdır.");
      }

      // SENARYO B (Mevcut Patron - Doğrudan Atama)
      await this.db.transaction(async (tx) => {
        await tx.update(organizations)
          .set({
            bossId: existingUser.id,
            bossEmail: emailLower,
            status: "ACTIVE",
          })
          .where(eq(organizations.id, organizationId));
      });

      try {
        await client.users.updateUserMetadata(existingUser.clerkId, {
          publicMetadata: {
            role: "boss",
            orgId: organizationId,
          }
        });

        await client.organizations.createOrganizationMembership({
          organizationId: organizationId,
          userId: existingUser.clerkId,
          role: "org:admin",
        });
      } catch (err) {
        console.warn(`[AdminService] Sahiplik Devri: Yeni patron Clerk eşitleme uyarısı:`, err);
      }

      revalidatePath("/admin");

      return {
        success: true,
        scenario: "EXISTING_BOSS",
        message: "Şirket sahipliği mevcut patrona doğrudan devredildi, davetiyeye gerek kalmadı.",
      };
    }

    // SENARYO A (Yeni Patron - Davet Gönderimi)
    await this.db.transaction(async (tx) => {
      await tx.update(organizations)
        .set({
          bossId: null as unknown as string,
          bossEmail: emailLower,
          status: "PENDING",
        })
        .where(eq(organizations.id, organizationId));
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL environment variable is not set");
    }

    let clerkInv = null;
    try {
      // ─── CLERK DAVETİ ─────────────────────────────────
      clerkInv = await client.invitations.createInvitation({
        emailAddress: emailLower,
        publicMetadata: {
          orgId: organizationId,
          role: "boss",
        },
        redirectUrl: `${appUrl}/sign-up`,
        ignoreExisting: true,
      });

      const { emailService } = await import("@/lib/services/email-service");
      const { getBossInvitationTemplate } = await import("@/lib/templates/email-templates");
      const text = `Merhaba, Topla Kazan platformu üzerinden ${org.name} bünyesinde "Firma Sahibi (Patron)" olarak kurumsal hesap aktivasyonunuzu (sahiplik devri) tamamlamanız için bir davet aldınız. Aktivasyon için şu adresi ziyaret edin: ${clerkInv.url || ""}. Bu daveti onaylamanız, KVKK Aydınlatma Metni'ni kabul ettiğiniz anlamına gelir.`;
      const html = getBossInvitationTemplate(clerkInv.url || "", org.name);

      await emailService.sendMail({
        to: emailLower,
        subject: `${org.name} — Kurumsal Katılım ve Hesap Aktivasyon Daveti`,
        html,
        text,
      }).catch((err) => {
        console.error("[EmailService] Sahiplik devri davet e-postası gönderim hatası:", err);
      });

      console.log(`[AdminService] 📩 Sahiplik Devri: Davetiye ${clerkInv.id} oluşturuldu ve ${emailLower} adresine gönderildi.`);
      
      revalidatePath("/admin");

      return {
        success: true,
        scenario: "NEW_BOSS",
        message: "Şirket sahipliği devri başlatıldı. Yeni patronun e-posta onayını yapması bekleniyor.",
      };
    } catch (err) {
      console.error("[AdminService] Sahiplik devri davetiyesi oluşturulamadı veya gönderilemedi:", err);
      throw new Error("Davetiye gönderim hatası sebebiyle sahiplik devri tamamlanamadı.");
    }
  }
}

export const adminService = new AdminService();
