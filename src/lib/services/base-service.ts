import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, staffProfiles, customerProfiles } from "@/db/schema";
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

  protected async getLocalUser(clerkId: string) {
    return await this.db.select().from(users).where(eq(users.clerkId, clerkId)).get();
  }

  protected async requireOrg() {
    const { userId } = await this.getSession();
    if (!userId) throw new Error("Oturum bulunamadı.");

    const dbUser = await this.getLocalUser(userId);
    if (!dbUser) {
      throw new Error("Kullanıcı kaydı bulunamadı.");
    }

    if (dbUser.role === "ADMIN") {
      const { organizations } = await import("@/db/schema");
      const firstOrg = await this.db.select().from(organizations).get();
      if (firstOrg) return firstOrg.id;
      throw new Error("Hiçbir organizasyon bulunamadı.");
    }

    if (dbUser.role === "BOSS") {
      const { organizations } = await import("@/db/schema");
      const org = await this.db.select().from(organizations).where(eq(organizations.bossId, dbUser.id)).get();
      if (!org) throw new Error("Şirketinize ait organizasyon kaydı bulunamadı.");
      return org.id;
    }

    if (dbUser.role === "MANAGER" || dbUser.role === "CASHIER") {
      const staff = await this.db.select().from(staffProfiles).where(eq(staffProfiles.userId, dbUser.id)).get();
      if (!staff) throw new Error("Personel şube kaydı bulunamadı.");
      const { branches } = await import("@/db/schema");
      const branch = await this.db.select().from(branches).where(eq(branches.id, staff.branchId)).get();
      if (!branch) throw new Error("Personel şubesi bulunamadı.");
      return branch.orgId;
    }

    if (dbUser.role === "CUSTOMER") {
      const customer = await this.db.select().from(customerProfiles).where(eq(customerProfiles.userId, dbUser.id)).get();
      if (!customer) throw new Error("Müşteri profil kaydı bulunamadı.");
      return customer.orgId;
    }

    throw new Error("Geçerli bir rol veya organizasyon bulunamadı.");
  }

  protected async isShowcaseOrg(_orgId: string) {
    // SaaS modelinde showcase/vitrin organizasyonu bulunmuyorsa false dön
    return false;
  }

  protected async isSuperAdmin() {
    try {
      const { userId } = await this.getSession();
      if (!userId) return false;
      const dbUser = await this.getLocalUser(userId);
      return dbUser?.role === "ADMIN";
    } catch {
      return false;
    }
  }

  protected async requireRole(roles: ("boss" | "manager" | "cashier" | "customer" | "superadmin" | "ADMIN" | "BOSS" | "MANAGER" | "CASHIER" | "CUSTOMER")[]) {
    const { userId } = await this.getSession();
    if (!userId) throw new Error("Oturum bulunamadı.");

    const dbUser = await this.getLocalUser(userId);
    if (!dbUser) {
      throw new Error("Kullanıcı kaydı bulunamadı.");
    }

    // Role mapping
    const mappedRoles = roles.map(r => {
      if (r === "superadmin") return "ADMIN";
      if (r === "boss") return "BOSS";
      if (r === "manager") return "MANAGER";
      if (r === "cashier") return "CASHIER";
      if (r === "customer") return "CUSTOMER";
      return r;
    });

    if (!mappedRoles.includes(dbUser.role)) {
      throw new Error(`Bu işlem için yetkiniz bulunmamaktadır. Gerekli roller: ${roles.join(", ")}`);
    }

    // Geriye uyumluluk için user nesnesini de dönelim
    const client = await this.getClerkClient();
    const user = await client.users.getUser(userId);

    return { user, dbUser, role: dbUser.role };
  }
}
