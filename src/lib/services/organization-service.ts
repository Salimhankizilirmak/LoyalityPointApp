import { BaseService } from "./base-service";
import { organizations, branches } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export class OrganizationService extends BaseService {
  async getAllBossOrganizations() {
    const { dbUser } = await this.requireRole(["BOSS", "ADMIN"]);
    return await this.db.select().from(organizations).where(eq(organizations.bossId, dbUser.id)).all();
  }

  async getBossProfile() {
    const session = await this.getSession();
    const user = await this.getCurrentUser();
    let orgData = null;

    if (session.orgId) {
      const client = await this.getClerkClient();
      const [org, dbOrg, branchCountResult] = await Promise.all([
        client.organizations.getOrganization({ organizationId: session.orgId }),
        this.db.select().from(organizations).where(eq(organizations.id, session.orgId)).get(),
        this.db.select({ count: sql<number>`COUNT(*)` }).from(branches).where(eq(branches.orgId, session.orgId)).get()
      ]);

      if (!dbOrg) {
        throw new Error("Bu organizasyon sistemde aktif değil veya onaylanmamış. Lütfen Sistem Yöneticisi ile iletişime geçin.");
      }

      orgData = {
        id: session.orgId,
        name: org.name,
        slug: org.slug || "",
        pointRate: 10,
        validityMonths: 12,
        branchLimit: dbOrg.branchLimit ?? 2,
        currentBranches: branchCountResult?.count ?? 0,
      };
    }

    return {
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses[0]?.emailAddress || "",
        imageUrl: user.imageUrl,
      },
      org: orgData,
    };
  }

  async createOrganization(name: string, slug: string) {
    const { dbUser } = await this.requireRole(["BOSS", "ADMIN"]);
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
      branchLimit: 2,
      isActive: true,
    });

    revalidatePath("/dashboard");
    return { success: true, id: org.id };
  }

  async createBranch(name: string, city: string) {
    await this.requireRole(["BOSS", "ADMIN"]);
    const orgId = await this.requireOrg();

    const existing = await this.db.select().from(organizations).where(eq(organizations.id, orgId)).get();
    if (!existing) {
      throw new Error("Bu organizasyon sistemde aktif değil veya onaylanmamış. Lütfen Sistem Yöneticisi ile iletişime geçin.");
    }

    const activeBranches = await this.db.select({ count: sql<number>`COUNT(*)` })
      .from(branches)
      .where(eq(branches.orgId, orgId))
      .get();
    
    const currentCount = activeBranches?.count ?? 0;
    const limit = existing.branchLimit;

    if (currentCount >= limit) {
      throw new Error(`Şube oluşturma limitine ulaştınız (Limit: ${limit}, Mevcut: ${currentCount}). Daha fazla şube eklemek için lütfen yöneticinizle iletişime geçin.`);
    }

    const duplicate = await this.db.select()
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

    const [newBranch] = await this.db.insert(branches).values({
      orgId,
      name,
      city,
      isActive: true,
    }).returning();

    revalidatePath("/boss-dashboard");
    return { success: true, id: newBranch.id, name, city };
  }

  async updateSettings(_pointRate: number, _validityMonths: number) {
    return { success: true };
  }

  async getBranches() {
    await this.requireRole(["BOSS", "ADMIN"]);
    const orgId = await this.requireOrg();
    return await this.db.select().from(branches).where(eq(branches.orgId, orgId)).all();
  }

  async updateName(newName: string) {
    const orgId = await this.requireOrg();
    await this.requireRole(["BOSS", "ADMIN"]);
    
    const client = await this.getClerkClient();
    await Promise.all([
      client.organizations.updateOrganization(orgId, { name: newName }),
      this.db.update(organizations).set({ name: newName }).where(eq(organizations.id, orgId))
    ]);

    return { success: true };
  }

  async deleteOrganization(id: string) {
    await this.requireRole(["BOSS", "ADMIN"]);
    const client = await this.getClerkClient();
    
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
    
    revalidatePath("/boss-dashboard");
    revalidatePath("/admin");
    return { success: true };
  }

  async deleteBranch(id: string) {
    await this.requireRole(["BOSS", "ADMIN"]);
    const session = await (await import("@clerk/nextjs/server")).auth();
    const orgId = session.orgId;
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
    
    revalidatePath("/boss-dashboard");
    return { success: true };
  }

  async toggleStatus(id: string) {
    await this.requireRole(["BOSS", "ADMIN"]);
    const branch = await this.db.select().from(branches).where(eq(branches.id, id)).get();
    if (!branch) throw new Error("Şube bulunamadı.");

    await this.db.update(branches)
      .set({ isActive: !branch.isActive })
      .where(eq(branches.id, id));

    revalidatePath("/boss-dashboard");
    return { success: true, newState: !branch.isActive };
  }

  async getDbOrg(id: string) {
    return await this.db.select().from(organizations).where(eq(organizations.id, id)).get();
  }
}

export const organizationService = new OrganizationService();
