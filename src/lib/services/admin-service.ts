import { BaseService } from "./base-service";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
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

      const invitation = await client.invitations.createInvitation({
        emailAddress: email,
        publicMetadata: { role: "boss" },
        redirectUrl: `${appUrl}/dashboard`,
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
    return await this.db.select().from(organizations).all();
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
