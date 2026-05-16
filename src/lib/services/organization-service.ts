import { BaseService } from "./base-service";
import { organizations, branches } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export class OrganizationService extends BaseService {
  async getAllBossOrganizations() {
    const { user } = await this.requireRole(["boss"]);
    const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
    return await this.db.select().from(organizations).where(eq(organizations.bossEmail, email)).all();
  }

  async getBossProfile() {
    const session = await this.getSession();
    const user = await this.getCurrentUser();
    let orgData = null;

    if (session.orgId) {
      const client = await this.getClerkClient();
      const [org, dbOrg] = await Promise.all([
        client.organizations.getOrganization({ organizationId: session.orgId }),
        this.db.select().from(organizations).where(eq(organizations.id, session.orgId)).get()
      ]);

      orgData = {
        id: session.orgId,
        name: org.name,
        slug: org.slug || "",
        pointRate: dbOrg?.pointRate || 10,
        validityMonths: dbOrg?.validityMonths || 12,
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
    const { user, role } = await this.requireRole(["boss"]);
    const client = await this.getClerkClient();
    const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";

    // Süper Admin Kısıtlaması: Sadece 1 Organizasyon
    if (role === "superadmin") {
      const existingOrgs = await this.db.select().from(organizations).where(eq(organizations.bossEmail, email)).all();
      if (existingOrgs.length >= 1) {
        throw new Error("Süper Admin olarak sadece 1 adet organizasyon kurabilirsiniz.");
      }
    }

    const org = await client.organizations.createOrganization({ name, slug, createdBy: user.id });
    
    await this.db.insert(organizations).values({
      id: org.id,
      name,
      slug,
      bossEmail: email,
      isActive: true,
    });

    revalidatePath("/dashboard");
    return { success: true, id: org.id };
  }

  async createBranch(name: string, city: string) {
    await this.requireRole(["boss"]);
    const orgId = await this.requireOrg();

    // 🛡️ AUTO-SYNC: Eğer organizasyon yerel DB'de yoksa Clerk'ten çek ve kaydet
    const existing = await this.db.select().from(organizations).where(eq(organizations.id, orgId)).get();
    if (!existing) {
      console.log(`[OrganizationService] 🔄 Auto-syncing org: ${orgId}`);
      const client = await this.getClerkClient();
      const clerkOrg = await client.organizations.getOrganization({ organizationId: orgId });
      const user = await this.getCurrentUser();
      const email = user.emailAddresses[0]?.emailAddress?.toLowerCase() || "";

      await this.db.insert(organizations).values({
        id: orgId,
        name: clerkOrg.name,
        slug: clerkOrg.slug || "",
        bossEmail: email,
        isActive: true,
      });
    }

    // 🔍 Mükerrer Şube Kontrolü (Aynı Şehir + Aynı İsim)
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

  async updateSettings(pointRate: number, validityMonths: number) {
    const orgId = await this.requireOrg();
    await this.requireRole(["boss"]); // Sadece patron

    await this.db.update(organizations)
      .set({ pointRate, validityMonths })
      .where(eq(organizations.id, orgId));
    
    return { success: true };
  }

  async getBranches() {
    await this.requireRole(["boss"]);
    const orgId = await this.requireOrg();
    return await this.db.select().from(branches).where(eq(branches.orgId, orgId)).all();
  }

  async updateName(newName: string) {
    const orgId = await this.requireOrg();
    await this.requireRole(["boss"]);
    
    const client = await this.getClerkClient();
    await Promise.all([
      client.organizations.updateOrganization(orgId, { name: newName }),
      this.db.update(organizations).set({ name: newName }).where(eq(organizations.id, orgId))
    ]);

    return { success: true };
  }

  async deleteOrganization(id: string) {
    await this.requireRole(["boss", "superadmin"]);
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

    // 🗑️ Yerel DB'den her durumda sil
    await this.db.delete(organizations).where(eq(organizations.id, id));
    
    revalidatePath("/boss-dashboard");
    revalidatePath("/admin");
    return { success: true };
  }

  async deleteBranch(id: string) {
    await this.requireRole(["boss", "superadmin"]);
    const session = await (await import("@clerk/nextjs/server")).auth();
    const orgId = session.orgId;
    const client = await this.getClerkClient();
    
    // 🛡️ 1. Bu şubeye ait bekleyen davetiyeleri bul ve iptal et
    if (orgId) {
      try {
        const invitations = await client.invitations.getInvitationList({ status: "pending" });
        // Clerk invitations listesinde bazen org bazlı filtreleme doğrudan yapılamayabilir, 
        // bu yüzden metadata üzerinden eşleşenleri buluyoruz.
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

    // 🗑️ 2. Şubeyi sil
    await this.db.delete(branches).where(eq(branches.id, id));
    
    revalidatePath("/boss-dashboard");
    return { success: true };
  }

  async toggleStatus(id: string) {
    await this.requireRole(["boss", "superadmin"]);
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
