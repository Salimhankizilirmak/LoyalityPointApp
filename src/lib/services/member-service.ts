import { BaseService } from "./base-service";

export class MemberService extends BaseService {
  async getOrgMembers() {
    const orgId = await this.requireOrg();
    const client = await this.getClerkClient();

    const [memberships, invitations] = await Promise.all([
      client.organizations.getOrganizationMembershipList({ organizationId: orgId, limit: 100 }),
      client.organizations.getOrganizationInvitationList({ organizationId: orgId, status: ["pending"] })
    ]);

    const activeMembers = await Promise.all(
      memberships.data.map(async (m) => {
        const uid = m.publicUserData?.userId;
        if (!uid) return null;
        const u = await client.users.getUser(uid);
        const meta = (u.publicMetadata || {}) as { role?: string };
        
        let role: "boss" | "manager" | "cashier" = "cashier";
        if (m.role === "org:admin") role = "boss";
        else if (meta.role === "manager") role = "manager";

        return {
          id: uid,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.emailAddresses[0]?.emailAddress || "?",
          email: u.emailAddresses[0]?.emailAddress || "",
          role,
          avatar: `${(u.firstName || "?")[0]}${(u.lastName || "?")[0]}`.toUpperCase(),
          status: "active" as const,
        };
      })
    );

    const pendingInvites = invitations.data.map(inv => ({
      id: `invite-${inv.id}`,
      name: inv.emailAddress.split("@")[0],
      email: inv.emailAddress,
      role: (inv.publicMetadata?.role as any) || "cashier",
      avatar: inv.emailAddress.charAt(0).toUpperCase() + "?",
      status: "pending" as const,
    }));

    return [...activeMembers.filter(Boolean), ...pendingInvites];
  }

  async inviteEmployee(data: { name: string; email: string; role: "manager" | "cashier"; branch: string; org_id?: string }) {
    const session = await this.getSession();
    const orgId = data.org_id || session.orgId;
    if (!orgId) throw new Error("Organizasyon bulunamadı");

    const { role: inviterRole } = (await this.requireRole(["boss", "manager"])) as { role: "boss" | "manager" | "superadmin" };
    
    // Yetki kontrolü: Boss -> Manager, Manager -> Cashier
    if (inviterRole === "boss" && data.role !== "manager") throw new Error("Patronlar yalnızca yönetici davet edebilir.");
    if (inviterRole === "manager" && data.role !== "cashier") throw new Error("Yöneticiler yalnızca kasiyer davet edebilir.");

    const client = await this.getClerkClient();
    
    // Davet gönder
    await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: data.email,
      inviterUserId: session.userId!,
      role: "org:member",
      publicMetadata: {
        role: data.role,
        branch: data.branch,
        org_id: orgId,
      },
    });

    // Metadata güncelle (varsa)
    const users = await client.users.getUserList({ emailAddress: [data.email] });
    if (users.data.length > 0) {
      await client.users.updateUserMetadata(users.data[0].id, {
        publicMetadata: { role: data.role, branch: data.branch, org_id: orgId },
      });
    }

    return { success: true };
  }

  async removeMember(memberId: string) {
    const session = await this.getSession();
    const orgId = await this.requireOrg();
    if (memberId === session.userId) throw new Error("Kendinizi silemezsiniz.");

    const client = await this.getClerkClient();

    if (memberId.startsWith("invite-")) {
      await client.organizations.revokeOrganizationInvitation({
        organizationId: orgId,
        invitationId: memberId.replace("invite-", ""),
        requestingUserId: session.userId!,
      });
    } else {
      await client.organizations.deleteOrganizationMembership({
        organizationId: orgId,
        userId: memberId,
      });
    }

    return { success: true };
  }

  async updateMemberName(memberId: string, firstName: string, lastName: string) {
    await this.requireOrg();
    if (memberId.startsWith("invite-")) throw new Error("Daveti onaylanmamış üye güncellenemez.");

    const client = await this.getClerkClient();
    await client.users.updateUser(memberId, { firstName, lastName });
    return { success: true };
  }
}

export const memberService = new MemberService();
