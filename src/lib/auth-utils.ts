import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Determines the correct redirection path for a user based on their roles,
 * organization status, and Super Admin privileges.
 * 
 * @param userId - The Clerk user ID
 * @param orgId - The Clerk organization ID (if any)
 * @param orgRole - The Clerk organization role (if any)
 * @returns A promise that resolves to the target URL path (e.g., "/admin", "/boss-dashboard")
 */
export async function getDashboardRedirectPath(
  userId: string,
  orgId: string | null | undefined,
  orgRole: string | null | undefined
): Promise<string> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  
  console.log(`[AuthUtils] Determining route for userId: ${userId}, orgId: ${orgId}, orgRole: ${orgRole}`);
  console.log(`[AuthUtils] User email: ${email}`);

  const meta = (user.publicMetadata || {}) as Record<string, unknown>;
  const unsafeMeta = (user.unsafeMetadata || {}) as Record<string, unknown>;
  const role = (meta.role as string) || (unsafeMeta.role as string);

  // 👑 1. Süper Admin Kontrolü (MUTLAK ÖNCELİK)
  const envEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
  const isSuperByEmail = envEmails.includes(email);
  const isSuperByRole = role === "super_admin" || role === "superadmin";

  if (isSuperByEmail || isSuperByRole) {
    console.log("[AuthUtils] 👑 Global Super Admin detected, redirecting to /admin");
    return "/admin";
  }

  // 🏢 2. Organizasyon Kontrolü (Aktif Session)
  if (orgId) {
    console.log(`[AuthUtils] Active OrgId found: ${orgId}. Checking DB status and roles...`);
    
    let isActive = true;
    try {
      const dbOrg = await db.select().from(organizations).where(eq(organizations.id, orgId)).get();
      if (dbOrg) isActive = dbOrg.isActive;
    } catch (dbError) {
      console.error("[AuthUtils] Database error during org check:", dbError);
    }
    
    const isBoss = orgRole === "org:admin" || role === "boss";
    if (!isActive && !isBoss) {
      console.log("[AuthUtils] Organization is inactive, redirecting to /org-disabled");
      return "/org-disabled";
    }

    if (orgRole === "org:admin") {
      console.log("[AuthUtils] Org:Admin detected, redirecting to /boss-dashboard");
      return "/boss-dashboard";
    }

    let membershipRole = "";
    try {
      const memberships = await client.users.getOrganizationMembershipList({ userId });
      const currentMembership = memberships.data.find(m => m.organization.id === orgId);
      if (currentMembership) {
        membershipRole = (currentMembership.publicMetadata?.role as string) || "";
      }
    } catch (err) {
      console.warn("[AuthUtils] Could not fetch membership metadata:", err);
    }

    const finalRole = role || membershipRole;
    if (finalRole === "manager") return "/manager-dashboard";
    if (finalRole === "cashier") return "/cashier-dashboard";
    if (finalRole === "customer") return "/customer-dashboard";

    const joinedRecently = Date.now() - (user.createdAt || 0) < 5 * 60 * 1000;
    if (joinedRecently) return "/sign-in?sync=true";

    console.log("[AuthUtils] OrgId present but role unknown → redirecting to /unauthorized");
    return "/unauthorized";
  }

  // 🎯 3. Zero-Selection / Metadata Bazlı Yönlendirme (Org seçilmemişse)
  console.log("[AuthUtils] No active OrgId, checking memberships, staff table and metadata...");
  
  // 🛡️ DB Staff Kontrolü (Metadata senkronizasyonu gecikmiş olabilir)
  try {
    const { staff: staffTable } = await import("@/db/schema");
    const staffMember = await db.select().from(staffTable).where(eq(staffTable.id, userId)).get();
    if (staffMember) {
      console.log(`[AuthUtils] Found staff member in DB: ${staffMember.role}`);
      if (staffMember.role === "manager") return "/manager-dashboard";
      if (staffMember.role === "cashier") return "/cashier-dashboard";
    }
  } catch (err) {
    console.warn("[AuthUtils] Staff table check failed:", err);
  }

  // Üyelikleri kontrol et (Yeni katılanlar için)
  try {
    const memberships = await client.users.getOrganizationMembershipList({ userId });
    if (memberships.data.length > 0) {
      const latest = memberships.data[0];
      const mRole = (latest.publicMetadata?.role as string) || "";
      const mOrgId = latest.organization.id;
      
      console.log(`[AuthUtils] Found membership: ${mOrgId}, Role: ${mRole}`);
      
      if (mRole === "manager") return "/manager-dashboard";
      if (mRole === "cashier") return "/cashier-dashboard";
      if (mRole === "customer") return "/customer-dashboard";
    }
  } catch (err) {
    console.warn("[AuthUtils] Membership check failed:", err);
  }
  const metaOrgId = meta.org_id as string;
  if (metaOrgId) {
    if (role === "manager") return "/manager-dashboard";
    if (role === "cashier") return "/cashier-dashboard";
    if (role === "customer") return "/customer-dashboard";
  }

  // 🚀 4. Organizasyonsuz Diğer Roller
  if (role === "boss") return "/create-organization";
  if (role === "customer") return "/customer-dashboard";

  if (["manager", "cashier"].includes(role)) {
    console.warn(`[AuthUtils] Internal member (${role}) without org → unauthorized.`);
    return "/unauthorized";
  }

  const createdRecently = Date.now() - (user.createdAt || 0) < 5 * 60 * 1000;
  if (createdRecently && (meta.invitation_ticket || unsafeMeta.ticket)) {
    return "/sign-in?sync=true";
  }

  console.log(`[AuthUtils] Access Denied for ${email}. Role: ${role || "None"}`);
  return "/unauthorized";
}
