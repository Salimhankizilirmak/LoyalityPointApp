import { BaseService } from "./base-service";

export class ManagerService extends BaseService {
  async getMyBranchData() {
    const user = await this.getCurrentUser();
    const meta = (user.publicMetadata || {}) as { branch_id?: string; org_id?: string; role?: string; branchName?: string };
    
    if (!meta.branch_id) throw new Error("Bir şubeye bağlı değilsiniz.");
    
    const { branches } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    // Şube bilgilerini getir
    const branch = await this.db.select().from(branches).where(eq(branches.id, meta.branch_id)).get();
    
    return {
      branchName: branch?.name || meta.branchName || "Bilinmeyen Şube",
      orgId: meta.org_id,
      branchId: meta.branch_id,
      role: meta.role || "manager"
    };
  }

  // Gelecekte buraya şubeye özel işlemler (transaction listesi vb.) eklenecek
}

export const managerService = new ManagerService();
