import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

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
    const { orgId, userId } = await this.getSession();
    if (orgId) return orgId;

    // 🛡️ Fallback: Eğer session'da orgId yoksa, veritabanındaki staff tablosuna bak (Manager/Cashier için)
    if (userId) {
      const { staff } = await import("@/db/schema");
      const staffMember = await this.db.select().from(staff).where(eq(staff.id, userId)).get();
      if (staffMember) {
        console.log(`[BaseService] 🔍 Found staff member in DB, using fallback orgId: ${staffMember.orgId}`);
        return staffMember.orgId;
      }
    }

    // Super Admin Bypass: Eğer kullanıcı Super Admin ise ve sistemde bir Vitrin şubesi varsa ona erişebilir.
    const isSuper = await this.isSuperAdmin();
    if (isSuper) {
      const showcaseOrg = await this.db.select().from(organizations).where(eq(organizations.isShowcase, true)).get();
      if (showcaseOrg) return showcaseOrg.id;
    }

    throw new Error("Aktif bir organizasyon/şube seçilmedi. Lütfen sisteme ait olduğunuz şifre/bağlantı üzerinden tekrar girin.");
  }

  protected async isShowcaseOrg(orgId: string) {
    const org = await this.db.select().from(organizations).where(eq(organizations.id, orgId)).get();
    return org?.isShowcase ?? false;
  }

  protected async isSuperAdmin() {
    try {
      const user = await this.getCurrentUser();
      const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
      const envEmails = process.env.SUPER_ADMIN_EMAILS || "";
      const superAdminEmails = envEmails.split(",").map(e => e.trim().toLowerCase());
      return superAdminEmails.includes(email);
    } catch {
      return false;
    }
  }

  protected async requireRole(roles: ("boss" | "manager" | "cashier" | "customer" | "superadmin")[]) {
    const user = await this.getCurrentUser();
    const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
    const envEmails = process.env.SUPER_ADMIN_EMAILS || "";
    const superAdminEmails = envEmails.split(",").map(e => e.trim().toLowerCase());
    
    // Super Admin check - ALWAYS ALLOW if user is a super admin
    if (superAdminEmails.includes(email)) {
      return { user, role: "superadmin" as const };
    }

    const session = await auth();
    let currentRole = (user.publicMetadata?.role as string);
    
    // Fallback: Eğer metadata yoksa ama Clerk'te "org:admin" rolüne sahipse "boss" say
    if (!currentRole) {
      if (session.orgRole === "org:admin" || session.sessionClaims?.o?.rol === "admin") {
        currentRole = "boss";
      } else {
        currentRole = "customer";
      }
    }

    if (!(roles as string[]).includes(currentRole)) {
      throw new Error(`Bu işlem için yetkiniz bulunmamaktadır. Gerekli roller: ${roles.join(", ")}`);
    }

    return { user, role: currentRole };
  }
}
