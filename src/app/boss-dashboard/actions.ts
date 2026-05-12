"use server";

import { organizationService } from "@/lib/services/organization-service";
import { memberService } from "@/lib/services/member-service";
import { clerkClient } from "@clerk/nextjs/server";

// Organization Services
export async function getAllBossOrganizations() {
  return await organizationService.getAllBossOrganizations();
}

export async function getBossProfile() {
  return await organizationService.getBossProfile();
}

export async function updateOrgSettings(pointRate: number, validityMonths: number) {
  return await organizationService.updateSettings(pointRate, validityMonths);
}

export async function createBranch(name: string, city: string) {
  return await organizationService.createBranch(name, city);
}

export async function updateOrgName(newName: string) {
  return await organizationService.updateName(newName);
}

export async function deleteOrganization(id: string) {
  return await organizationService.deleteOrganization(id);
}

// Member Services
export async function getOrgMembers() {
  return await memberService.getOrgMembers();
}

export async function inviteEmployee(data: any) {
  try {
    return await memberService.inviteEmployee(data);
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function updateMemberName(memberId: string, firstName: string, lastName: string) {
  return await memberService.updateMemberName(memberId, firstName, lastName);
}

export async function removeMember(memberId: string) {
  return await memberService.removeMember(memberId);
}

// User Profile
export async function updateBossName(firstName: string, lastName: string) {
  const client = await clerkClient();
  // This could also be in a UserService if needed, for now keeping it simple
  const { userId } = await (await import("@clerk/nextjs/server")).auth();
  if (!userId) throw new Error("Yetkisiz");
  await client.users.updateUser(userId, { firstName, lastName });
  return { success: true };
}
