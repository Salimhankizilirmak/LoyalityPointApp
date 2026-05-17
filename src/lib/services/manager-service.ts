import { BaseService } from "./base-service";
import { staffProfiles, branches } from "@/db/schema";
import { eq } from "drizzle-orm";

export class ManagerService extends BaseService {
  async getMyBranchData() {
    const { userId } = await this.getSession();
    const dbUser = await this.getLocalUser(userId!);
    if (!dbUser) throw new Error("Kullanıcı kaydı bulunamadı.");

    const staffProfile = await this.db.select().from(staffProfiles).where(eq(staffProfiles.userId, dbUser.id)).get();
    if (!staffProfile) throw new Error("Bir şubeye bağlı değilsiniz.");

    const branch = await this.db.select().from(branches).where(eq(branches.id, staffProfile.branchId)).get();
    if (!branch) throw new Error("Şube kaydı bulunamadı.");
    
    return {
      branchName: branch.name,
      orgId: branch.orgId,
      branchId: branch.id,
      role: dbUser.role.toLowerCase()
    };
  }
}

export const managerService = new ManagerService();
