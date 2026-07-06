import { BaseService } from "./base-service";
import { normalizePhoneToUsername, sanitizePhoneTo10 } from "@/lib/utils";
import { users, staffProfiles, branches, organizations, userBranches, invitations } from "@/db/schema";
import { eq, and, sql, inArray, or } from "drizzle-orm";

export class StaffService extends BaseService {
  async getOrgMembers() {
    const isSuper = await this.isSuperAdmin();
    const { userId } = await this.getSession();
    const localUser = await this.getLocalUser(userId!);
    if (!localUser) return [];

    let targetOrgIds: string[] = [];
    let targetBranchIds: string[] = [];

    if (isSuper) {
      const allOrgs = await this.db.select().from(organizations).all();
      targetOrgIds = allOrgs.map(o => o.id);
    } else if (localUser.role === "BOSS") {
      const bossOrgs = await this.db.select().from(organizations).where(eq(organizations.bossId, localUser.id)).all();
      targetOrgIds = bossOrgs.map(o => o.id);
    } else {
      // MANAGER veya CASHIER için: Onlara atanan şube veya organizasyonu bul
      const assignments = await this.db.select().from(userBranches).where(eq(userBranches.userId, localUser.id)).all();
      const profile = await this.db.select().from(staffProfiles).where(eq(staffProfiles.userId, localUser.id)).get();
      const invite = await this.db.select().from(invitations).where(eq(invitations.email, localUser.email)).get();
      
      const branchIds = [...new Set([...assignments.map(a => a.branchId), profile?.branchId, invite?.branchId].filter(Boolean))] as string[];
      if (branchIds.length > 0) {
        targetBranchIds = branchIds;
        const bList = await this.db.select().from(branches).where(inArray(branches.id, branchIds)).all();
        targetOrgIds = [...new Set(bList.map(b => b.orgId))];
      } else if (invite?.organizationId) {
        targetOrgIds = [invite.organizationId];
      }
    }

    if (targetOrgIds.length === 0 && targetBranchIds.length === 0) return [];

    // Query members in these organizations
    // INNER JOIN replaced with LEFT JOIN + Invitations fallback to support accepted staff missing staffProfiles
    const members = await this.db.select({
      id: users.id,
      clerkId: users.clerkId,
      email: users.email,
      role: users.role,
      branchName: sql<string>`COALESCE(${branches.name}, 'Belirsiz Şube')`,
      branchId: sql<string>`COALESCE(${branches.id}, ${invitations.branchId})`,
      isActive: sql<boolean>`COALESCE(${staffProfiles.isActive}, true)`,
    })
    .from(users)
    .leftJoin(staffProfiles, eq(users.id, staffProfiles.userId))
    .leftJoin(branches, eq(staffProfiles.branchId, branches.id))
    .leftJoin(invitations, and(eq(users.email, invitations.email), eq(invitations.status, "ACCEPTED")))
    .where(
      and(
        targetBranchIds.length > 0
          ? sql`COALESCE(${branches.id}, ${invitations.branchId}) IN (${sql.join(targetBranchIds.map(id => sql`${id}`), sql`, `)})`
          : sql`COALESCE(${branches.orgId}, ${invitations.organizationId}) IN (${sql.join(targetOrgIds.map(id => sql`${id}`), sql`, `)})`,
        or(eq(users.role, "MANAGER"), eq(users.role, "CASHIER"), eq(users.role, "BOSS"))
      )
    )
    .all();

    const client = await this.getClerkClient();

    // Fetch stats for these members
    const activeMemberIds = members.map(m => m.id);
    let txStats: any[] = [];
    if (activeMemberIds.length > 0) {
      const { loyaltyTransactions } = await import("@/db/schema");
      txStats = await this.db.select({
        cashierId: loyaltyTransactions.cashierId,
        type: loyaltyTransactions.type,
        status: loyaltyTransactions.status,
        pointsAmount: loyaltyTransactions.pointsAmount,
        amountSpent: loyaltyTransactions.amountSpent,
        createdAt: loyaltyTransactions.createdAt,
      })
      .from(loyaltyTransactions)
      .where(
        and(
          inArray(loyaltyTransactions.cashierId, activeMemberIds),
          eq(loyaltyTransactions.status, "SUCCESS")
        )
      )
      .all();
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayTimestamp = Math.floor(startOfToday.getTime() / 1000);

    const statsMap = new Map<string, { txCount: number; pointsEarned: number; pointsSpent: number; dailyAmount: number }>();
    for (const tx of txStats) {
      if (!statsMap.has(tx.cashierId)) {
        statsMap.set(tx.cashierId, { txCount: 0, pointsEarned: 0, pointsSpent: 0, dailyAmount: 0 });
      }
      const stats = statsMap.get(tx.cashierId)!;
      stats.txCount += 1;
      if (tx.type === "EARN") {
        stats.pointsEarned += tx.pointsAmount;
      } else if (tx.type === "BURN") {
        stats.pointsSpent += tx.pointsAmount;
      }
      
      const txTime = typeof tx.createdAt === "number" ? tx.createdAt : (tx.createdAt ? Math.floor(tx.createdAt.getTime() / 1000) : 0);
      if (txTime >= todayTimestamp) {
         stats.dailyAmount += (tx.amountSpent || 0);
      }
    }

    // --- Kasiyer Counter Verileri ---
    // 1) acceptedAt: Kasiyerin daveti kabul ettiği tarih (invitations tablosundan)
    const acceptedInvitations = await this.db.select({
      email: invitations.email,
      createdAt: invitations.createdAt,
      status: invitations.status,
    })
    .from(invitations)
    .where(eq(invitations.status, "ACCEPTED"))
    .all();

    const acceptedAtMap = new Map<string, Date | number | null>();
    for (const inv of acceptedInvitations) {
      const normalizedEmail = inv.email.trim().toLowerCase();
      // acceptedAt olarak createdAt kullanıyoruz (davet oluşturulma tarihi zaten kartlarda gösteriliyordu)
      // Gerçek onay tarihi henüz ayrı bir kolonda tutulmadığı için createdAt'i davet tarihi olarak koruyacağız
      acceptedAtMap.set(normalizedEmail, inv.createdAt);
    }

    // 2) invitedCustomerCount: Her kasiyerin CUSTOMER rolünde davet ettiği müşteri sayısı
    const customerInviteCounts = await this.db.select({
      invitedBy: invitations.invitedBy,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(invitations)
    .where(
      and(
        eq(invitations.role, "CUSTOMER"),
        inArray(invitations.invitedBy, activeMemberIds)
      )
    )
    .groupBy(invitations.invitedBy)
    .all();

    const invitedCustomerMap = new Map<string, number>();
    for (const row of customerInviteCounts) {
      invitedCustomerMap.set(row.invitedBy, row.count);
    }

    const activeMembers = await Promise.all(members.map(async (m) => {
      const stats = statsMap.get(m.id) || { txCount: 0, pointsEarned: 0, pointsSpent: 0, dailyAmount: 0 };
      const normalizedEmail = m.email.trim().toLowerCase();
      const acceptedAt = acceptedAtMap.get(normalizedEmail) || null;
      const invitedCustomerCount = invitedCustomerMap.get(m.id) || 0;
      try {
        const u = await client.users.getUser(m.clerkId);
        return {
          id: m.id,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.emailAddresses[0]?.emailAddress || m.email,
          email: m.email,
          role: m.role.toLowerCase(),
          branch: m.branchName,
          avatar: `${(u.firstName || "?")[0]}${(u.lastName || "?")[0]}`.toUpperCase(),
          status: m.isActive ? ("active" as const) : ("suspended" as const),
          txCount: stats.txCount,
          pointsEarned: stats.pointsEarned,
          pointsSpent: stats.pointsSpent,
          dailyAmount: stats.dailyAmount,
          acceptedAt,
          invitedCustomerCount,
        };
      } catch {
        return {
          id: m.id,
          name: m.email.split("@")[0],
          email: m.email,
          role: m.role.toLowerCase(),
          branch: m.branchName,
          avatar: m.email.charAt(0).toUpperCase() + "?",
          status: m.isActive ? ("active" as const) : ("suspended" as const),
          txCount: stats.txCount,
          pointsEarned: stats.pointsEarned,
          pointsSpent: stats.pointsSpent,
          dailyAmount: stats.dailyAmount,
          acceptedAt,
          invitedCustomerCount,
        };
      }
    }));

    const activeEmails = new Set(activeMembers.map(m => m.email));

    // Pending invitations
    const pendingInvites = await Promise.all(targetOrgIds.map(async (orgId) => {
      try {
        const invites = await client.organizations.getOrganizationInvitationList({ organizationId: orgId, status: ["pending"] });
        return invites.data
          .filter(inv => !activeEmails.has(inv.emailAddress))
          .map(inv => ({
            id: `invite-${inv.id}`,
            name: inv.emailAddress.split("@")[0],
            email: inv.emailAddress,
            role: (inv.publicMetadata?.role as string) || "cashier",
            branch: (inv.publicMetadata?.branchName as string) || "Bilinmeyen Şube",
            avatar: inv.emailAddress.charAt(0).toUpperCase() + "?",
            status: "pending" as const,
          }));
      } catch {
        return [];
      }
    }));

    return [...activeMembers, ...pendingInvites.flat()];
  }

  async inviteEmployee(data: { name: string; email: string; role: "manager" | "cashier"; branch: string; org_id?: string; phone: string }) {
    const session = await this.getSession();

    // Davet eden kullanıcının lokal veritabanındaki kaydını sorgula
    const dbUser = await this.db.select().from(users).where(eq(users.clerkId, session.userId!)).get();
    if (!dbUser) {
      throw new Error("Davet eden kullanıcı sistemde bulunamadı.");
    }

    const orgId = data.org_id || await this.requireOrg();
    if (!orgId) throw new Error("Lütfen bir şube seçin. Organizasyon ID eksik.");

    const client = await this.getClerkClient();
    const emailLower = data.email.toLowerCase().trim();

    const currentUser = await client.users.getUser(session.userId!);
    const currentUserEmail = currentUser.emailAddresses[0]?.emailAddress?.toLowerCase();
    if (emailLower === currentUserEmail) {
      throw new Error("Kendi e-posta adresinize davet gönderemezsiniz.");
    }

    const envEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
    if (envEmails.includes(emailLower)) {
      throw new Error("Bu e-posta adresi sisteme davet edilemez.");
    }

    const targetBranch = await this.db.select()
      .from(branches)
      .where(and(
        sql`lower(${branches.name}) = lower(${data.branch})`,
        eq(branches.orgId, orgId)
      ))
      .get();

    if (!targetBranch) throw new Error(`'${data.branch}' isimli şube bulunamadı veya bu organizasyona ait değil.`);
    if (!targetBranch.isActive) {
      throw new Error(`'${targetBranch.name}' şubesi şu an pasif durumdadır. Pasif şubelere personel davet edilemez.`);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL environment variable is not set");
    }

    // Telefon numarasını temizle ve doğrula
    const cleanedPhone = sanitizePhoneTo10(data.phone);
    if (!/^5\d{9}$/.test(cleanedPhone)) {
      throw new Error("Geçersiz telefon numarası formatı. Telefon numarası 5 ile başlamalı ve 10 haneli olmalıdır.");
    }
    const normalizedPhone = normalizePhoneToUsername(data.phone); // Clerk için eski formatı koruyoruz

    // Telefon numarası benzersizlik kontrolü (users.username)
    const existingUserByPhone = await this.db
      .select()
      .from(users)
      .where(eq(users.username, normalizedPhone))
      .get();
    if (existingUserByPhone) {
      throw new Error("PHONE_ALREADY_REGISTERED");
    }

    // Aktif davetiye çakışma kontrolü (organizasyon bazlı)
    const existingInviteByPhone = await this.db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.phoneNumber, cleanedPhone),
          eq(invitations.organizationId, orgId),
          or(eq(invitations.status, "PENDING"), eq(invitations.status, "ACCEPTED"))
        )
      )
      .get();
    if (existingInviteByPhone) {
      throw new Error("PHONE_INVITATION_EXISTS");
    }

    try {
      // ─── CLERK DAVETİ ─────────────────────────────────
      const clerkInv = await client.invitations.createInvitation({
        emailAddress: emailLower,
        publicMetadata: {
          orgId: orgId,
          role: data.role,
          branch_id: targetBranch.id,
          branchId: targetBranch.id,
          branchName: data.branch,
          org_id: orgId,
          phone: normalizedPhone,
        },
        redirectUrl: `${appUrl}/dashboard`,
        ignoreExisting: true,
      });

      const org = await this.db.select().from(organizations).where(eq(organizations.id, orgId)).get();
      const orgName = org?.name || "Şirket";

      const { emailService } = await import("@/lib/services/email-service");
      const { getEmployeeInvitationTemplate } = await import("@/lib/templates/email-templates");
      const targetRole = data.role.toLowerCase() as "manager" | "cashier";
      const html = getEmployeeInvitationTemplate(
        clerkInv.url || "",
        targetRole,
        targetBranch.name
      );

      await emailService.sendMail({
        to: emailLower,
        subject: `${orgName} Personel Daveti`,
        html,
      }).catch((err) => {
        console.error("[EmailService] Personel davet e-postası gönderim hatası:", err);
      });

      // Davetiyeyi yerel veritabanına ekle
      const { invitations: localInvitations } = await import("@/db/schema");
      await this.db.insert(localInvitations).values({
        clerkInviteId: clerkInv.id,
        email: emailLower,
        phoneNumber: cleanedPhone, // 10 haneli ham string kaydediliyor
        organizationId: orgId,
        branchId: targetBranch.id,
        role: data.role.toUpperCase() as "BOSS" | "MANAGER" | "CASHIER",
        status: "PENDING",
        invitedBy: dbUser.id,
      });

      return { success: true };
    } catch (err) {
      console.error("[StaffService] Staff invitation failed:", err);
      throw err;
    }
  }

  async removeMember(memberId: string) {
    const session = await this.getSession();
    const orgId = await this.requireOrg();
    
    const dbUser = await this.db.select().from(users).where(eq(users.id, memberId)).get();
    const targetClerkId = dbUser ? dbUser.clerkId : memberId;

    if (targetClerkId === session.userId) throw new Error("Kendinizi silemezsiniz.");

    const client = await this.getClerkClient();

    if (memberId.startsWith("invite-")) {
      const invId = memberId.replace("invite-", "");
      await client.organizations.revokeOrganizationInvitation({
        organizationId: orgId,
        invitationId: invId,
        requestingUserId: session.userId!,
      });
    } else {
      if (dbUser && dbUser.role === "SUPER_ADMIN") {
        throw new Error("Süper Admin sistemden silinemez.");
      }

      await Promise.all([
        client.organizations.deleteOrganizationMembership({
          organizationId: orgId,
          userId: targetClerkId,
        }),
        client.users.updateUserMetadata(targetClerkId, {
          publicMetadata: { role: null, branch: null, org_id: null, branch_id: null }
        }),
        this.db.delete(staffProfiles).where(eq(staffProfiles.userId, memberId)),
        this.db.delete(users).where(eq(users.id, memberId))
      ]);
    }

    return { success: true };
  }

  async reassignManager(memberId: string, newBranchName: string, newOrgId: string) {
    await this.requireRole(["BOSS", "SUPER_ADMIN"]);
    
    const dbUser = await this.db.select().from(users).where(eq(users.id, memberId)).get();
    if (!dbUser) throw new Error("Kullanıcı bulunamadı.");
    if (dbUser.role === "SUPER_ADMIN") throw new Error("Süper Admin şubesi değiştirilemez.");

    const targetBranch = await this.db.select().from(branches).where(and(eq(branches.name, newBranchName), eq(branches.orgId, newOrgId))).get();
    if (!targetBranch) throw new Error("Şube bulunamadı.");

    await this.db.update(staffProfiles)
      .set({ branchId: targetBranch.id })
      .where(eq(staffProfiles.userId, memberId));

    const client = await this.getClerkClient();
    await client.users.updateUserMetadata(dbUser.clerkId, {
      publicMetadata: { branch_id: targetBranch.id, branchName: newBranchName, org_id: newOrgId }
    });

    return { success: true };
  }

  async updateMemberName(memberId: string, firstName: string, lastName: string) {
    const dbUser = await this.db.select().from(users).where(eq(users.id, memberId)).get();
    if (!dbUser) throw new Error("Kullanıcı bulunamadı.");
    if (dbUser.role === "SUPER_ADMIN") throw new Error("Süper Admin bilgileri güncellenemez.");

    const client = await this.getClerkClient();
    await client.users.updateUser(dbUser.clerkId, { firstName, lastName });
    return { success: true };
  }

  /**
   * HİYERARŞİK VERİ İZOLASYONU MUHAFIZI
   */
  async requireBranchAccess(userId: string, userRole: string, branchId: string) {
    if (userRole === "SUPER_ADMIN") {
      return true;
    }

    if (userRole === "BOSS") {
      const branch = await this.db.select().from(branches).where(eq(branches.id, branchId)).get();
      if (!branch) throw new Error("Şube bulunamadı.");

      const org = await this.db.select().from(organizations).where(eq(organizations.bossId, userId)).get();
      if (!org) throw new Error("Organizasyon bulunamadı.");

      if (branch.orgId !== org.id) {
        throw new Error("UnauthorizedError: Bu şubenin verilerine erişim yetkiniz bulunmamaktadır.");
      }
      return true;
    }

    if (userRole === "MANAGER" || userRole === "CASHIER") {
      const assignment = await this.db.select()
        .from(userBranches)
        .where(
          and(
            eq(userBranches.userId, userId),
            eq(userBranches.branchId, branchId)
          )
        ).get();
      
      if (!assignment) {
        throw new Error("UnauthorizedError: Bu şubenin verilerine erişim yetkiniz bulunmamaktadır.");
      }
      return true;
    }

    throw new Error("Geçersiz rol yetkisi.");
  }

  /**
   * SENSİTİV TOPLU GÜNCELLEME VE GÜVENLİ SİLME
   */
  async assignStaffToBranches(bossUserId: string, bossOrgId: string, staffUserId: string, branchIds: string[]) {
    // 1. Cross-Tenant Assignment Guard
    if (branchIds.length > 0) {
      const targetBranches = await this.db.select().from(branches).where(inArray(branches.id, branchIds));
      if (targetBranches.length !== branchIds.length) {
        throw new Error("Güvenlik İhlali: Bazı şubeler bulunamadı.");
      }

      for (const branch of targetBranches) {
        if (branch.orgId !== bossOrgId) {
          throw new Error("Güvenlik İhlali: Farklı bir organizasyona ait şubeye personel ataması yapılamaz.");
        }
      }
    }

    // Boss'a ait tüm şubelerin ID'lerini al
    const bossBranches = await this.db.select({ id: branches.id }).from(branches).where(eq(branches.orgId, bossOrgId));
    const bossBranchIds = bossBranches.map(b => b.id);

    // 2. ACID Transaction Bloklama & Scoped Bulk Delete
    await this.db.transaction(async (tx) => {
      // Scoped delete: Sadece bu boss'un şubelerindeki yetkileri sil (Kör silme engellendi)
      if (bossBranchIds.length > 0) {
        await tx.delete(userBranches)
          .where(
            and(
              eq(userBranches.userId, staffUserId),
              inArray(userBranches.branchId, bossBranchIds)
            )
          );
      }

      // Yeni atamaları yap
      if (branchIds.length > 0) {
        await tx.insert(userBranches).values(
          branchIds.map(id => ({
            userId: staffUserId,
            branchId: id
          }))
        );
      }
    });

    // 3. CLERK ORGANİZASYON ÜYELİĞİ SENKRONİZASYONU
    try {
      const staffUser = await this.db.select().from(users).where(eq(users.id, staffUserId)).get();
      if (staffUser?.clerkId) {
        const client = await this.getClerkClient();
        await client.organizations.createOrganizationMembership({
          organizationId: bossOrgId,
          userId: staffUser.clerkId,
          role: "org:member"
        });
      }
    } catch (err: unknown) {
      // Zaten üyeyse veya başka bir Clerk hatası olursa bypass et
      console.log("Clerk organizasyon üyeliği eşitleme atlandı:", err instanceof Error ? err.message : err);
    }

    return { success: true };
  }
}

export const staffService = new StaffService();
