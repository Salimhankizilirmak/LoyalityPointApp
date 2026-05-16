"use server";

import { adminService } from "@/lib/services/admin-service";
import { headers } from "next/headers";

export async function inviteBossAction(email: string) {
  const headerList = await headers();
  const host = headerList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const appUrl = `${protocol}://${host}`;

  try {
    return await adminService.inviteBoss(email, appUrl);
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Bilinmeyen hata") };
  }
}

export async function toggleOrgStatus(orgId: string, currentStatus: boolean) {
  try {
    return await adminService.toggleOrgStatus(orgId, currentStatus);
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Bilinmeyen hata") };
  }
}

export async function revokeBossInvitation(invitationId: string) {
  try {
    return await adminService.revokeBossInvitation(invitationId);
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Bilinmeyen hata") };
  }
}

export async function getInvitedBosses() {
  try {
    return await adminService.getInvitedBosses();
  } catch {
    return [];
  }
}

export async function getAllOrganizations() {
  try {
    return await adminService.getAllOrganizations();
  } catch {
    return [];
  }
}

export async function getGlobalAnalytics() {
  try {
    return await adminService.getGlobalAnalytics();
  } catch (error) {
    console.error("Global analytics error:", error);
    return null;
  }
}
