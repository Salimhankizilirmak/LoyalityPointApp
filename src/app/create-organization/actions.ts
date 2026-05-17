"use server";

import { auth } from "@clerk/nextjs/server";
import { organizationService } from "@/lib/services/organization-service";

export async function createBossOrganization(name: string, slug: string) {
  try {
    const { sessionClaims } = await auth();
    interface CustomJwtPayload {
      o?: { rol?: string };
      metadata?: { role?: string };
      email?: string;
    }
    const claims = sessionClaims as unknown as CustomJwtPayload;
    const role = claims?.metadata?.role || claims?.o?.rol;
    const email = claims?.email?.toLowerCase() || "";
    const isSuperByRole = role === "super_admin" || role === "superadmin";
    const isSuperByEmail = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).includes(email);

    if (!isSuperByRole && !isSuperByEmail) {
      throw new Error("Yetkisiz işlem. Organizasyonları yalnızca Sistem Yöneticisi oluşturabilir.");
    }

    return await organizationService.createOrganization(name, slug);
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Bilinmeyen hata") };
  }
}
