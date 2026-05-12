"use server";

import { organizationService } from "@/lib/services/organization-service";

export async function createBossOrganization(name: string, slug: string) {
  try {
    return await organizationService.createOrganization(name, slug);
  } catch (error: any) {
    return { error: error.message };
  }
}
