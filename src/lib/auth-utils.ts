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

  // 1. Süper Admin Kontrolü
  const envEmails = process.env.SUPER_ADMIN_EMAILS || "";
  const allowedEmails = envEmails
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(e => e !== "");

  if (allowedEmails.includes(email)) {
    console.log("[AuthUtils] Super Admin detected, redirecting to /admin");
    return "/admin";
  }

  // 2. Organizasyon Kontrolü
  if (orgId) {
    console.log(`[AuthUtils] OrgId found: ${orgId}. Checking DB status...`);
    const dbOrg = await db.select().from(organizations).where(eq(organizations.id, orgId)).get();
    
    if (dbOrg && !dbOrg.isActive) {
      console.log("[AuthUtils] Organization is inactive, redirecting to /org-disabled");
      return "/org-disabled";
    }

    // Organizasyona bağlı rol kontrolü
    if (orgRole === "org:admin") {
      console.log("[AuthUtils] Org:Admin detected, redirecting to /boss-dashboard");
      return "/boss-dashboard";
    }

    const meta = (user.publicMetadata || {}) as Record<string, unknown>;
    console.log(`[AuthUtils] Checking metadata role for org user: ${meta.role}`);
    
    if (meta.role === "manager") {
      console.log("[AuthUtils] Manager detected, redirecting to /manager-dashboard");
      return "/manager-dashboard";
    }

    if (meta.role === "cashier") {
      console.log("[AuthUtils] Cashier detected, redirecting to /cashier-dashboard");
      return "/cashier-dashboard";
    }

    if (meta.role === "customer") {
      console.log("[AuthUtils] Customer detected, redirecting to /customer-dashboard");
      return "/customer-dashboard";
    }

    // Default: yetkisi belirlenememiş organizasyon üyesi
    console.log("[AuthUtils] Unknown org role, redirecting to /unauthorized");
    return "/unauthorized";
  }

  // 3. Organizasyonsuz Kullanıcılar
  const meta = (user.publicMetadata || {}) as Record<string, unknown>;
  console.log(`[AuthUtils] No OrgId. Metadata role: ${meta.role}`);

  if (meta.role === "boss") {
    console.log("[AuthUtils] Invited Boss detected without org, redirecting to /create-organization");
    return "/create-organization";
  }

  if (meta.role === "customer") {
    // Organizasyona dahil edilmemiş, yeni kayıt olan müşteri
    console.log("[AuthUtils] Customer detected without org, redirecting to /customer-dashboard");
    return "/customer-dashboard";
  }

  // Eğer hiçbir yetkisi yoksa ve organizasyona bağlı değilse: IZINSIZ GIRIŞ
  console.log("[AuthUtils] No access, redirecting to /unauthorized");
  return "/unauthorized";
}
