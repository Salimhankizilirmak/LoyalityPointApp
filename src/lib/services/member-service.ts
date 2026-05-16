import { BaseService } from "./base-service";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

export class MemberService extends BaseService {
  async getOrgMembers() {
    const isSuper = await this.isSuperAdmin();
    const client = await this.getClerkClient();
    
    let targetOrgIds: string[] = [];

    if (isSuper) {
      // Super Admin her şeyi görebilir
      const allOrgs = await this.db.select().from(organizations).all();
      targetOrgIds = allOrgs.map(o => o.id);
    } else {
      // Boss ise tüm şubelerini bul
      const { user } = await this.requireRole(["boss"]);
      const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
      const bossOrgs = await this.db.select().from(organizations).where(eq(organizations.bossEmail, email)).all();
      targetOrgIds = bossOrgs.map(o => o.id);
    }

    if (targetOrgIds.length === 0) return [];

    // Tüm organizasyonlardaki üyeleri ve davetiyeleri topla
    const allResultsRaw = await Promise.all(
      targetOrgIds.map(async (orgId) => {
        try {
          const [memberships, invitations] = await Promise.all([
            client.organizations.getOrganizationMembershipList({ organizationId: orgId, limit: 100 }),
            client.organizations.getOrganizationInvitationList({ organizationId: orgId, status: ["pending"] })
          ]);
          
          const orgInfo = await this.db.select().from(organizations).where(eq(organizations.id, orgId)).get();

          return { memberships: memberships.data, invitations: invitations.data, orgName: orgInfo?.name || "Bilinmiyor" };
        } catch (err) {
          // 🛡️ Clerk tarafında silinmiş organizasyonları yönet
          const clerkErr = err as { status?: number; code?: string };
          if (clerkErr.status === 404 || clerkErr.code === 'resource_not_found') {
            console.log(`[MemberService] 🧹 Cleaning up deleted Clerk org: ${orgId}`);
            await this.db.update(organizations).set({ isActive: false }).where(eq(organizations.id, orgId));
          } else {
            console.warn(`[MemberService] ⚠️ Could not fetch data for org ${orgId}:`, err);
          }
          return null;
        }
      })
    );

    const allResults = allResultsRaw.filter((r): r is NonNullable<typeof r> => r !== null);

    const activeMembers = (await Promise.all(
      allResults.flatMap(res => res.memberships).map(async (m) => {
        const uid = m.publicUserData?.userId;
        if (!uid) return null;
        const u = await client.users.getUser(uid);
        const meta = (u.publicMetadata || {}) as { role?: string; branch?: string };
        
        // 🛡️ SECURITY: Super Admin listelerde asla görünmez
        if (meta.role === "superadmin") return null;

        const res = allResults.find(r => r.memberships.some(mem => mem.id === m.id));

        return {
          id: uid,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.emailAddresses[0]?.emailAddress || "?",
          email: u.emailAddresses[0]?.emailAddress || "",
          role: (meta.role as string) || "cashier",
          branch: meta.branch || res?.orgName || "Genel",
          avatar: `${(u.firstName || "?")[0]}${(u.lastName || "?")[0]}`.toUpperCase(),
          status: "active" as const,
        };
      })
    )).filter(Boolean);

    const activeEmails = new Set(activeMembers.filter(Boolean).map(m => m?.email));

    const pendingInvites = allResults.flatMap(res => 
      res.invitations
        .filter(inv => !activeEmails.has(inv.emailAddress))
        .filter(inv => inv.publicMetadata?.role !== "superadmin") // 🛡️ SECURITY
        .map(inv => ({
          id: `invite-${inv.id}`,
          name: inv.emailAddress.split("@")[0],
          email: inv.emailAddress,
          role: (inv.publicMetadata?.role as string) || "cashier",
          branch: (inv.publicMetadata?.branch as string) || res.orgName,
          avatar: inv.emailAddress.charAt(0).toUpperCase() + "?",
          status: "pending" as const,
        }))
    );

    return [...activeMembers as { id: string; name: string; email: string; role: string; branch: string; avatar: string; status: "active" | "pending" }[], ...pendingInvites];
  }

  async inviteEmployee(data: { name: string; email: string; role: "manager" | "cashier"; branch: string; org_id?: string }) {
    const session = await this.getSession();
    const orgId = data.org_id || session.orgId;
    if (!orgId) throw new Error("Lütfen bir şube seçin. Organizasyon ID eksik.");

    const client = await this.getClerkClient();
    const emailLower = data.email.toLowerCase().trim();

    // 1. 🛡️ Kendi Kendini Davet Kontrolü
    const currentUser = await client.users.getUser(session.userId!);
    const currentUserEmail = currentUser.emailAddresses[0]?.emailAddress?.toLowerCase();
    if (emailLower === currentUserEmail) {
      throw new Error("Kendi e-posta adresinize davet gönderemezsiniz. Lütfen ekip üyenizin e-postasını girin.");
    }

    // 2. 🛡️ SECURITY: Süper Admin Kontrolü
    const envEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
    if (envEmails.includes(emailLower)) {
      throw new Error("Bu e-posta adresi sisteme davet edilemez."); // Detay vermiyoruz
    }

    // 3. 🛡️ Mevcut Üye Kontrolü (Zaten kabul etmiş veya Ghost Metadata kalmış)
    const existingUsers = await client.users.getUserList({ emailAddress: [data.email] });
    const existingUser = existingUsers.data[0];
    if (existingUser) {
      const meta = (existingUser.publicMetadata || {}) as { role?: string };
      if (meta.role === "superadmin") {
        throw new Error("Bu e-posta adresi sisteme davet edilemez.");
      }
      if (meta.role) {
        // Rolü var görünüyor ama gerçekten bir organizasyonda mı?
        const userMemberships = await client.users.getOrganizationMembershipList({ userId: existingUser.id });
        if (userMemberships.data.length > 0) {
          throw new Error("Bu e-posta adresi bir organizasyona zaten kayıtlı. Aynı kişiyi tekrar davet edemezsiniz.");
        }
        // Eğer memberships boşsa, bu iptal edilmiş bir davetiyeden kalan "hayalet" metadatadır.
        // Hata fırlatmak yerine devam etmesine izin veriyoruz, metadata yeni davetle ezilecek.
        console.log(`[MemberService] Ghost metadata detected for ${data.email}. Allowing re-invite.`);
      }
    }

    // 4. 🛡️ Bekleyen Davet Kontrolü
    const invitations = await client.invitations.getInvitationList({ 
      status: "pending"
    });
    
    // Clerk bazen emailAddress filtresini global listede desteklemeyebilir, manuel filtreliyoruz
    const pendingInvite = invitations.data.find(inv => inv.emailAddress.toLowerCase() === emailLower);
    
    if (pendingInvite) {
      const inviteRole = (pendingInvite.publicMetadata?.role as string) || "üye";
      const roleLabel = inviteRole === "manager" ? "Yönetici" : inviteRole === "cashier" ? "Kasiyer" : "Personel";
      throw new Error(`Bu e-posta adresine zaten bir ${roleLabel} daveti gönderilmiş. Kabul edilmesi bekleniyor.`);
    }

    const { role: inviterRole } = (await this.requireRole(["boss", "manager", "superadmin"])) as { role: "boss" | "manager" | "superadmin" };
    
    // Yetki kontrolü: Boss sadece Manager, Manager sadece Kasiyer davet edebilir.
    if (inviterRole === "boss" && data.role !== "manager") {
      throw new Error("Patronlar yalnızca yönetici davet edebilir.");
    }
    if (inviterRole === "manager" && data.role !== "cashier") {
      throw new Error("Yöneticiler yalnızca kasiyer davet edebilir.");
    }


    const { staff: staffTable, branches, organizations } = await import("@/db/schema");
    const { eq, and, sql } = await import("drizzle-orm");
    
    // 🛡️ Organizasyon Kontrolü
    const res = await this.db.select().from(organizations).where(eq(organizations.id, orgId)).get();
    if (!res) throw new Error("Organizasyon veritabanında bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.");

    // 🛡️ Şube Kontrolü (Case-insensitive search)
    const targetBranch = await this.db.select()
      .from(branches)
      .where(and(
        sql`lower(${branches.name}) = lower(${data.branch})`,
        eq(branches.orgId, orgId)
      ))
      .get();

    if (!targetBranch) throw new Error(`'${data.branch}' isimli şube bulunamadı veya bu organizasyona ait değil.`);
    
    // 🛡️ Şube Aktiflik Kontrolü
    if (!targetBranch.isActive) {
      throw new Error(`'${targetBranch.name}' şubesi şu an pasif durumdadır. Pasif şubelere yeni personel davet edilemez.`);
    }
    
    // Davet gönder
    const invitation = await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: data.email,
      inviterUserId: session.userId!,
      role: "org:member",
      publicMetadata: {
        role: data.role,
        branch_id: targetBranch.id,
        branchName: data.branch,
        org_id: orgId,
        orgName: res?.name || "Organizasyon"
      },
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
    });

    // Yerel DB'ye davet kaydı at (Pending staff)
    await this.db.insert(staffTable).values({
      id: `pending-${invitation.id}`, // Geçici ID
      orgId: orgId,
      branchId: targetBranch.id,
      role: data.role,
      isActive: false // Henüz onaylamadı
    }).onConflictDoUpdate({
      target: staffTable.id,
      set: { orgId, branchId: targetBranch.id, role: data.role }
    });

    // Metadata güncelle (Eğer kullanıcı zaten sistemde kayıtlıysa)
    const users = await client.users.getUserList({ emailAddress: [data.email] });
    if (users.data.length > 0) {
      await client.users.updateUserMetadata(users.data[0].id, {
        publicMetadata: { role: data.role, branch_id: targetBranch.id, branchName: data.branch, org_id: orgId },
      });
    }

    return { success: true };
  }

  async removeMember(memberId: string) {
    const session = await this.getSession();
    const orgId = await this.requireOrg();
    if (memberId === session.userId) throw new Error("Kendinizi silemezsiniz.");

    const client = await this.getClerkClient();
    const { staff: staffTable } = await import("@/db/schema");
    const { eq, and } = await import("drizzle-orm");

    if (memberId.startsWith("invite-")) {
      try {
        const invId = memberId.replace("invite-", "");
        
        // Önce davetiyenin kime gittiğini bulup metadata'sını temizleyelim (kullanıcı kayıtlıysa)
        const orgInvites = await client.organizations.getOrganizationInvitationList({ organizationId: orgId });
        const targetInvite = orgInvites.data.find(inv => inv.id === invId);
        
        if (targetInvite) {
          const email = targetInvite.emailAddress;
          const users = await client.users.getUserList({ emailAddress: [email] });
          if (users.data.length > 0) {
            await client.users.updateUserMetadata(users.data[0].id, {
              publicMetadata: { role: null, branch: null, branch_id: null, branchName: null, org_id: null }
            });
            console.log(`[MemberService] Cleared metadata for revoked invite: ${email}`);
          }
        }

        await client.organizations.revokeOrganizationInvitation({
          organizationId: orgId,
          invitationId: invId,
          requestingUserId: session.userId!,
        });
      } catch (error: unknown) {
        const clerkError = error as { errors?: { code: string }[] };
        if (clerkError.errors?.[0]?.code === "organization_invitation_not_pending") {
          console.warn("Invitation already settled:", memberId);
        } else {
          throw error;
        }
      }
      // Yerel DB'den de temizle (Eğer varsa)
      await this.db.delete(staffTable).where(and(eq(staffTable.id, memberId.replace("invite-", "pending-")), eq(staffTable.orgId, orgId)));
    } else {
      // 🛡️ SECURITY: Süper Admin silinemez
      const targetUser = await client.users.getUser(memberId);
      if (targetUser.publicMetadata?.role === "superadmin") {
        throw new Error("Süper Admin sistemden silinemez.");
      }
      // Aktif üye silme: Organizasyondan çıkar, metadata temizle ve oturumları revoke et
      const [sessions] = await Promise.all([
        client.sessions.getSessionList({ userId: memberId }),
        client.organizations.deleteOrganizationMembership({
          organizationId: orgId,
          userId: memberId,
        }),
        client.users.updateUserMetadata(memberId, {
          publicMetadata: { role: null, branch: null, org_id: null }
        }),
        // Yerel veritabanından da sil (Purge)
        this.db.delete(staffTable).where(and(eq(staffTable.id, memberId), eq(staffTable.orgId, orgId)))
      ]);

      // Tüm aktif oturumları sonlandır
      if (sessions.data.length > 0) {
        await Promise.all(sessions.data.map(s => client.sessions.revokeSession(s.id)));
      }
    }

    return { success: true };
  }

  async reassignManager(memberId: string, newBranchName: string, newOrgId: string) {
    await this.requireRole(["boss", "superadmin"]);
    const client = await this.getClerkClient();
    
    // 🛡️ SECURITY: Davet aşamasındaki veya Süper Admin olan üyelerin şubesi değiştirilemez
    if (memberId.startsWith("invite-")) {
      throw new Error("Davet aşamasındaki üyelerin şubesi değiştirilemez. Lütfen davetin kabul edilmesini bekleyin.");
    }

    const targetUser = await client.users.getUser(memberId);
    if (targetUser.publicMetadata?.role === "superadmin") {
      throw new Error("Süper Admin şubesi değiştirilemez.");
    }

    const { staff: staffTable, branches } = await import("@/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const targetBranch = await this.db.select().from(branches).where(and(eq(branches.name, newBranchName), eq(branches.orgId, newOrgId))).get();
    if (!targetBranch) throw new Error("Şube bulunamadı.");

    // 1. Clerk Metadata Güncelle
    await client.users.updateUserMetadata(memberId, {
      publicMetadata: { branch_id: targetBranch.id, branchName: newBranchName, org_id: newOrgId }
    });

    // 2. Yerel DB Güncelle (Upsert mantığı)
    const existing = await this.db.select().from(staffTable).where(eq(staffTable.id, memberId)).get();
    if (existing) {
      await this.db.update(staffTable)
        .set({ orgId: newOrgId, branchId: targetBranch.id })
        .where(eq(staffTable.id, memberId));
    } else {
      await this.db.insert(staffTable).values({
        id: memberId,
        orgId: newOrgId,
        branchId: targetBranch.id,
        role: "manager",
        isActive: true
      });
    }

    return { success: true };
  }

  async updateMemberName(memberId: string, firstName: string, lastName: string) {
    await this.requireOrg();
    if (memberId.startsWith("invite-")) throw new Error("Daveti onaylanmamış üye güncellenemez.");

    const client = await this.getClerkClient();
    
    // 🛡️ SECURITY: Süper Admin'in bilgileri güncellenemez
    const targetUser = await client.users.getUser(memberId);
    if (targetUser.publicMetadata?.role === "superadmin") {
      throw new Error("Süper Admin bilgileri güncellenemez.");
    }

    await client.users.updateUser(memberId, { firstName, lastName });
    return { success: true };
  }
}

export const memberService = new MemberService();
