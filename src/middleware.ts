import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";

// 1. Modül Düzeyinde Strongly-Typed Custom JWT Payload Arayüzü (Garbage Collection & Scope Optimizasyonu)
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

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/", "/unauthorized", "/org-disabled"]);

// 🛡️ API & Server Action JSON Çatlama Yaması Helper
function handleUnauthorized(req: NextRequest, pathname: string) {
  const isApi = pathname.startsWith("/api");
  const isServerAction = req.method === "POST" && (
    req.headers.get("Next-Action") !== null || 
    req.headers.get("accept")?.includes("text/x-component")
  );

  if (isApi || isServerAction) {
    return NextResponse.json(
      { success: false, error: "Yetkisiz Erişim" },
      { status: 403 }
    );
  }
  return NextResponse.redirect(new URL("/unauthorized", req.url));
}

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

  console.log(`[Middleware] 🧩 Raw SessionClaims: ${JSON.stringify(sessionClaims)}`);
  const claims = sessionClaims as unknown as CustomJwtPayload;
  
  // ⚡ Canlı Oturum Önceliklendirmesi (Live Session Ground Truth)
  let role = "";
  if (orgId && orgRole) {
    if (orgRole === "org:admin") {
      role = "boss";
    } else {
      role = claims.metadata?.role || claims.o?.rol || "";
    }
  } else {
    role = claims.metadata?.role || claims.o?.rol || "";
  }

  const activeOrgId = orgId || claims.o?.id || "";
  const userEmail = claims.email?.toLowerCase() || "";
  
  console.log(`[Middleware] 🎭 Resolved Role: ${role}, OrgId: ${activeOrgId}, Email: ${userEmail}`);

  // Super Admin tespiti
  const envEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
  const isSuperByEmail = envEmails.includes(userEmail) || userEmail === "novexistech@gmail.com";
  const isSuperByRole = role === "super_admin" || role === "superadmin";
  const isSuperAdmin = isSuperByRole || isSuperByEmail;

  // 🛡️ Route Guard 1: Super Admin /admin
  if (pathname.startsWith("/admin")) {
    if (!isSuperAdmin) {
      console.warn(`[Middleware] 🛑 Gating: Only super admins can access /admin. User: ${userId}`);
      return handleUnauthorized(req, pathname);
    }
  }

  // 🛡️ Route Guard 2: Boss Dashboard & API Koruması
  if (pathname.startsWith("/boss-dashboard") || pathname.startsWith("/api/boss")) {
    const isBoss = role === "boss" || orgRole === "org:admin";
    if (!isBoss && !isSuperAdmin) {
      console.warn(`[Middleware] 🛑 Gating: Unauthorized access to Boss routes (${pathname}). Role: ${role}`);
      return handleUnauthorized(req, pathname);
    }
  }

  // 🛡️ Route Guard 3: Manager Dashboard & API Koruması
  if (pathname.startsWith("/manager-dashboard") || pathname.startsWith("/api/manager")) {
    if (role !== "manager" && !isSuperAdmin) {
      console.warn(`[Middleware] 🛑 Gating: Unauthorized access to Manager routes (${pathname}). Role: ${role}`);
      return handleUnauthorized(req, pathname);
    }
  }

  // 🛡️ Route Guard 4: Cashier Dashboard & API Koruması
  if (pathname.startsWith("/cashier-dashboard") || pathname.startsWith("/api/cashier")) {
    if (role !== "cashier" && !isSuperAdmin) {
      console.warn(`[Middleware] 🛑 Gating: Unauthorized access to Cashier routes (${pathname}). Role: ${role}`);
      return handleUnauthorized(req, pathname);
    }
  }

  // 🚀 SMART REDIRECTION: /dashboard üzerinden doğrudan yönlendirme
  if (pathname === "/dashboard") {
    console.log(`[Middleware] 🎯 Traffic Control for /dashboard. User: ${userId}, Role: ${role}, Org: ${activeOrgId}`);
    
    if (isSuperAdmin) {
      console.log(`[Middleware] 👑 Super Admin Detected -> Redirecting to /admin`);
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    if (role === "boss" && !activeOrgId) {
      return handleUnauthorized(req, pathname);
    }

    if (activeOrgId) {
      if (orgRole === "org:admin" || role === "boss") return NextResponse.redirect(new URL("/boss-dashboard", req.url));
      if (role === "manager") return NextResponse.redirect(new URL("/manager-dashboard", req.url));
      if (role === "cashier") return NextResponse.redirect(new URL("/cashier-dashboard", req.url));
      if (role === "customer") return NextResponse.redirect(new URL("/customer-dashboard", req.url));
    }
    
    if (role === "customer") return NextResponse.redirect(new URL("/customer-dashboard", req.url));

    console.log("[Middleware] ⚠️ Role/Org unknown, falling back");
  }

  // 🛡️ Hardened Gating: /create-organization
  if (pathname.startsWith("/create-organization")) {
    if (!isSuperAdmin) {
      console.warn(`[Middleware] 🛑 Gating: Only super admins can access /create-organization. Email: ${userEmail}`);
      return handleUnauthorized(req, pathname);
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
