import { BaseService } from "./base-service";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
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
    const { user } = await this.requireRole(["boss"]);
    const client = await this.getClerkClient();
    const email = user.primaryEmailAddress?.emailAddress || "";

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
    const { user } = await this.requireRole(["boss"]);
    await this.requireOrg();
    const client = await this.getClerkClient();
    
    const slug = `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`;
    const newOrg = await client.organizations.createOrganization({ name, slug, createdBy: user.id });

    await this.db.insert(organizations).values({
      id: newOrg.id,
      name,
      slug,
      bossEmail: user.emailAddresses[0]?.emailAddress || "",
    });

    return { success: true, id: newOrg.id, name, city };
  }

  async updateSettings(pointRate: number, validityMonths: number) {
    const orgId = await this.requireOrg();
    await this.requireRole(["boss"]); // Sadece patron

    await this.db.update(organizations)
      .set({ pointRate, validityMonths })
      .where(eq(organizations.id, orgId));
    
    return { success: true };
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
    
    await Promise.all([
      client.organizations.deleteOrganization(id),
      this.db.delete(organizations).where(eq(organizations.id, id))
    ]);

    return { success: true };
  }
}

export const organizationService = new OrganizationService();
