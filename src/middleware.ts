import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/", "/unauthorized", "/org-disabled"]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const search = req.nextUrl.search;
  
  console.log(`[Middleware] 🌐 Request: ${pathname}${search}`);

  // 1. Herkes için açık olan sayfalar
  if (isPublicRoute(req)) {
    const { userId } = await auth();
    const isSyncRequest = req.nextUrl.searchParams.get("sync") === "true";
    const isClerkTask = pathname.includes("/tasks/") || pathname.includes("/choose-organization");
    
    if (userId && (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up") || isClerkTask) && !isSyncRequest) {
      console.log(`[Middleware] 🔄 Already Logged In or in Clerk Task -> Force Redirecting to /dashboard`);
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 2. Korumalı sayfalar için oturum kontrolü
  const authData = await auth();
  const { userId, orgId, orgRole, sessionClaims, redirectToSignIn } = authData;

  if (!userId) {
    console.log(`[Middleware] 🛑 No User -> Redirecting to Sign-In`);
    return redirectToSignIn({ returnBackUrl: pathname });
  }

  interface CustomJwtPayload {
    o?: {
      id: string;
      rol: string;
    };
    metadata?: {
      role?: string;
    };
    email?: string;
  }

  console.log(`[Middleware] 🧩 Raw SessionClaims: ${JSON.stringify(sessionClaims)}`);
  const claims = sessionClaims as unknown as CustomJwtPayload;
  
  // Önce organizasyon rolüne, yoksa metadata rolüne bak
  const role = claims.o?.rol || claims.metadata?.role || "";
  const orgIdInJwt = claims.o?.id || "";
  
  console.log(`[Middleware] 🎭 Resolved Role: ${role}, OrgId: ${orgIdInJwt}`);

  // 🚀 SMART REDIRECTION: /dashboard üzerinden doğrudan yönlendirme
  if (pathname === "/dashboard") {
    console.log(`[Middleware] 🎯 Traffic Control for /dashboard. User: ${userId}, Role: ${role}`);
    
    // 1. SUPER ADMIN CHECK (Highest Priority)
    const email = (sessionClaims as unknown as CustomJwtPayload)?.email?.toLowerCase() || "";
    const envEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
    const isSuperByEmail = envEmails.includes(email);
    const isSuperByRole = role === "super_admin" || role === "superadmin";

    if (isSuperByEmail || isSuperByRole) {
      console.log(`[Middleware] 👑 Super Admin Detected -> Redirecting to /admin`);
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    // 2. BOSS ROLE CHECK (If no org, go to create-organization)
    if (role === "boss" && !orgId && !orgIdInJwt) {
      return NextResponse.redirect(new URL("/create-organization", req.url));
    }

    // 3. ACTIVE ORG CHECK (Role based redirects)
    if (orgId || orgIdInJwt) {
      if (orgRole === "org:admin") return NextResponse.redirect(new URL("/boss-dashboard", req.url));
      if (role === "manager") return NextResponse.redirect(new URL("/manager-dashboard", req.url));
      if (role === "cashier") return NextResponse.redirect(new URL("/cashier-dashboard", req.url));
      if (role === "customer") return NextResponse.redirect(new URL("/customer-dashboard", req.url));
    }

    // 4. ZERO-SELECTION / JWT ORGID CHECK
    if (orgIdInJwt) {
      if (role === "manager") return NextResponse.redirect(new URL("/manager-dashboard", req.url));
      if (role === "cashier") return NextResponse.redirect(new URL("/cashier-dashboard", req.url));
      if (role === "customer") return NextResponse.redirect(new URL("/customer-dashboard", req.url));
    }
    
    // 5. CUSTOMER FALLBACK
    if (role === "customer") return NextResponse.redirect(new URL("/customer-dashboard", req.url));

    // Fallback for new or unauthorized users
    console.log("[Middleware] ⚠️ Role/Org unknown, falling back to /dashboard logic");
  }

  // 🛡️ Hardened Gating: /create-organization rotasını koru
  if (pathname.startsWith("/create-organization")) {
    if (role !== "boss" && role !== "superadmin") {
      const email = (sessionClaims as unknown as CustomJwtPayload)?.email?.toLowerCase() || "";
      const isSuper = (process.env.SUPER_ADMIN_EMAILS || "").split(",").includes(email);
      if (!isSuper) {
        console.warn(`[Middleware] 🛑 Forbidden access to /create-organization by: ${role || "Guest"}`);
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
