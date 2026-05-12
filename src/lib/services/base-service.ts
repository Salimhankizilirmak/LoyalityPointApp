import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";

export abstract class BaseService {
  protected db = db;

  protected async getSession() {
    const session = await auth();
    if (!session.userId) {
      throw new Error("Oturum bulunamadı. Lütfen giriş yapın.");
    }
    return session;
  }

  protected async getClerkClient() {
    return await clerkClient();
  }

  protected async getCurrentUser() {
    const { userId } = await this.getSession();
    const client = await this.getClerkClient();
    return await client.users.getUser(userId);
  }

  protected async requireOrg() {
    const { orgId } = await this.getSession();
    if (!orgId) {
      throw new Error("Aktif bir organizasyon/şube seçilmedi.");
    }
    return orgId;
  }

  protected async requireRole(roles: ("boss" | "manager" | "cashier" | "customer" | "superadmin")[]) {
    const user = await this.getCurrentUser();
    const role = (user.publicMetadata?.role as string) || "customer";
    
    // Super Admin kontrolü (env üzerinden)
    const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
    const envEmails = process.env.SUPER_ADMIN_EMAILS || "";
    const superAdminEmails = envEmails.split(",").map(e => e.trim().toLowerCase());
    
    if (superAdminEmails.includes(email) && roles.includes("superadmin")) {
      return { user, role: "superadmin" as const };
    }

    if (!roles.includes(role)) {
      throw new Error(`Bu işlem için yetkiniz bulunmamaktadır. Gerekli roller: ${roles.join(", ")}`);
    }

    return { user, role };
  }
}
