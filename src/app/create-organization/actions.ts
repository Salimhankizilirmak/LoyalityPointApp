"use server";

import { organizationService } from "@/lib/services/organization-service";

export async function createBossOrganization(name: string, slug: string) {
  try {
    return await organizationService.createOrganization(name, slug);
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Bilinmeyen hata") };
  }
}
