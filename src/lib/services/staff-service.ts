import { BaseService } from "./base-service";
import { users, staffProfiles, branches, organizations } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export class StaffService extends BaseService {
  async getOrgMembers() {
    const isSuper = await this.isSuperAdmin();
    const { userId } = await this.getSession();
    const localUser = await this.getLocalUser(userId!);
    if (!localUser) return [];

    let targetOrgIds: string[] = [];

    if (isSuper) {
      const allOrgs = await this.db.select().from(organizations).all();
      targetOrgIds = allOrgs.map(o => o.id);
    } else {
      const bossOrgs = await this.db.select().from(organizations).where(eq(organizations.bossId, localUser.id)).all();
      targetOrgIds = bossOrgs.map(o => o.id);
    }

    if (targetOrgIds.length === 0) return [];

    // Query members in these organizations
    const members = await this.db.select({
      id: users.id,
      clerkId: users.clerkId,
      email: users.email,
      role: users.role,
      branchName: branches.name,
      branchId: branches.id,
      status: sql<string>`'active'`,
    })
    .from(users)
    .innerJoin(staffProfiles, eq(users.id, staffProfiles.userId))
    .innerJoin(branches, eq(staffProfiles.branchId, branches.id))
    .where(sql`${branches.orgId} IN (${sql.join(targetOrgIds.map(id => sql`${id}`), sql`, `)})`)
    .all();

    const client = await this.getClerkClient();
    const activeMembers = await Promise.all(members.map(async (m) => {
      try {
        const u = await client.users.getUser(m.clerkId);
        return {
          id: m.id,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.emailAddresses[0]?.emailAddress || m.email,
          email: m.email,
          role: m.role.toLowerCase(),
          branch: m.branchName,
          avatar: `${(u.firstName || "?")[0]}${(u.lastName || "?")[0]}`.toUpperCase(),
          status: "active" as const,
        };
      } catch {
        return {
          id: m.id,
          name: m.email.split("@")[0],
          email: m.email,
          role: m.role.toLowerCase(),
          branch: m.branchName,
          avatar: m.email.charAt(0).toUpperCase() + "?",
          status: "active" as const,
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

  async inviteEmployee(data: { name: string; email: string; role: "manager" | "cashier"; branch: string; org_id?: string }) {
    const session = await this.getSession();
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

    await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: data.email,
      inviterUserId: session.userId!,
      role: "org:member",
      publicMetadata: {
        role: data.role,
        branch_id: targetBranch.id,
        branchName: data.branch,
        org_id: orgId,
      },
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
    });

    return { success: true };
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
      if (dbUser && dbUser.role === "ADMIN") {
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
    await this.requireRole(["BOSS", "ADMIN"]);
    
    const dbUser = await this.db.select().from(users).where(eq(users.id, memberId)).get();
    if (!dbUser) throw new Error("Kullanıcı bulunamadı.");
    if (dbUser.role === "ADMIN") throw new Error("Süper Admin şubesi değiştirilemez.");

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
    if (dbUser.role === "ADMIN") throw new Error("Süper Admin bilgileri güncellenemez.");

    const client = await this.getClerkClient();
    await client.users.updateUser(dbUser.clerkId, { firstName, lastName });
    return { success: true };
  }
}

export const staffService = new StaffService();
