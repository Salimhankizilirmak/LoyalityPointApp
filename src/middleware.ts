import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";

// 1. Modül Düzeyinde Strongly-Typed Custom JWT Payload Arayüzü
interface CustomJwtPayload {
  o?: {
    id: string;
    rol: string;
  };
  metadata?: {
    role?: string;
    orgId?: string;
    branch_id?: string;
    branchId?: string;
  };
  email?: string;
}

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/", "/org-disabled", "/auth-callback", "/api/webhooks/clerk(.*)", "/kvkk", "/q", "/q/(.*)"]);

// 🛡️ API & Server Action JSON Çatlama Yaması Helper
function handleUnauthorized(req: NextRequest, pathname: string) {
  const isDirectApi = pathname.startsWith("/api");

  if (isDirectApi) {
    return NextResponse.json(
      { success: false, error: "Yetkisiz Erişim" },
      { status: 403 }
    );
  }

  return NextResponse.redirect(new URL("/sign-in", req.url));
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const search = req.nextUrl.search;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  console.log(`[Middleware] 🌐 Request: ${pathname}${search}`);

  // 🛡️ Server Action isteklerini (POST + next-action başlığı olanlar) yönlendirmelerden muaf tut
  if (req.method === "POST" && req.headers.has("next-action")) {
    console.log(`[Middleware] ⚙️ Server Action request detected: ${pathname}. Bypassing middleware redirects.`);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 1. Herkes için açık olan sayfalar
  if (isPublicRoute(req)) {
    // 🛡️ /sign-up rotasına özel katı Bilet Kontrolü (Ticket Guard)
    if (pathname.startsWith("/sign-up")) {
      const isClerkInternalSignUp = 
        pathname.includes("/sign-up/sso-callback") || 
        pathname.includes("SignIn_clerk_catchall_") ||
        pathname.includes("SignUp_clerk_catchall_");

      if (!isClerkInternalSignUp) {
        const hasTicketInUrl =
          req.nextUrl.searchParams.has("ticket") ||
          req.nextUrl.searchParams.has("__clerk_ticket") ||
          req.nextUrl.searchParams.has("__clerk_invitation_token");

        const hasTicketInCookies =
          req.cookies.has("__clerk_ticket") ||
          req.cookies.has("__clerk_invitation_token") ||
          req.cookies.has("clerk_invitation_ticket") ||
          req.cookies.getAll().some(c => 
            c.name.includes("ticket") || 
            c.name.includes("invitation")
          );

        const authData = await auth();
        const hasValidAuthContext = !!authData.userId || !!authData.orgId;

        const isAuthorized = hasTicketInUrl || hasTicketInCookies || hasValidAuthContext;

        if (!isAuthorized) {
          console.warn(`[Middleware] 🛑 Gating: Unauthorized Sign-up block! No ticket, cookie or auth context found. Redirecting to /sign-in.`);
          return NextResponse.redirect(new URL("/sign-in", req.url));
        }
      }
    }

    const { userId } = await auth();
    const isSyncRequest = req.nextUrl.searchParams.get("sync") === "true";
    const isClerkTask = pathname.includes("/tasks/") || pathname.includes("/choose-organization");

    // Oturum açmış kullanıcıyı / (kök), /sign-in ve /sign-up'dan koru.
    // /auth-callback'e dokunma — JIT sync sayfası orada çalışıyor.
    const isRootOrAuthPage = pathname === "/" ||
      pathname.startsWith("/sign-in") ||
      pathname.startsWith("/sign-up") ||
      isClerkTask;

    if (userId && isRootOrAuthPage && !isSyncRequest && req.method !== "POST") {
      console.log(`[Middleware] 🔄 Authenticated user on public/root page (${pathname}) -> Redirecting to /dashboard`);
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 2. Korumalı sayfalar için oturum kontrolü
  const authData = await auth();
  const { userId, orgId, orgRole, sessionClaims, redirectToSignIn } = authData;

  const hasInvitationTicket = req.nextUrl.searchParams.has("__clerk_ticket") || req.nextUrl.searchParams.has("ticket");
  if (!userId && hasInvitationTicket) {
    const isSignUpRoute = pathname.startsWith("/sign-up");
    
    // Eğer kullanıcı zaten sign-up sayfasında DEĞİLSE, onu bilet parametreleriyle beraber oraya zorla
    if (!isSignUpRoute) {
      console.log(`[Middleware] 🎟️ New user invitation ticket detected on ${pathname}. Smart redirecting to /sign-up.`);
      const signUpUrl = new URL("/sign-up", req.url);
      signUpUrl.search = req.nextUrl.search; // URL'deki __clerk_ticket ve diğer parametreleri aynen taşı
      return NextResponse.redirect(signUpUrl);
    }

    // Zaten /sign-up sayfasındaysa bırak geçsin (biletini orada eritecek)
    console.log(`[Middleware] 🎟️ Ticket consumption permitted on sign-up route.`);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (!userId) {
    if (pathname.startsWith("/q")) {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    console.log(`[Middleware] 🛑 No User -> Redirecting to Sign-In`);
    return redirectToSignIn({ returnBackUrl: pathname });
  }

  console.log(`[Middleware] 🧩 Raw SessionClaims: ${JSON.stringify(sessionClaims)}`);
  const claims = sessionClaims as unknown as CustomJwtPayload;

  const userEmail = claims.email?.toLowerCase().trim() || "";
  const activeOrgId = orgId || claims.metadata?.orgId || claims.o?.id || "";

  // 👑 KRİTİK DEĞİŞİKLİK: Super Admin Tespiti En Tepeye Alındı (Short-Circuit)
  const envEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
  const isSuperByEmail = envEmails.includes(userEmail) || userEmail === "novexistech@gmail.com";
  const isSuperByMetadata = claims.metadata?.role === "super_admin" || claims.metadata?.role === "superadmin";
  const isSuperAdmin = isSuperByEmail || isSuperByMetadata;

  let role = "";

  if (isSuperAdmin) {
    // Eğer kullanıcı Super Admin ise, organizasyon rollerini tamamen EZ ve maskele
    role = "super_admin";
  } else {
    // 🏢 Standart Kullanıcılar İçin Canlı Oturum Önceliklendirmesi
    if (orgId && orgRole) {
      if (orgRole === "org:admin") {
        role = "boss";
      } else {
        role = claims.metadata?.role || claims.o?.rol || "";
      }
    } else {
      role = claims.metadata?.role || claims.o?.rol || "";
    }
  }

  console.log(`[Middleware] 🎭 Resolved Role: ${role}, OrgId: ${activeOrgId}, Email: ${userEmail}`);

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

    if (role === "boss") {
      return NextResponse.redirect(new URL("/boss-dashboard", req.url));
    }

    if (role === "manager") {
      return NextResponse.redirect(new URL("/manager-dashboard", req.url));
    }

    if (role === "cashier") {
      const activeBranch = req.cookies.get("active_branch_id")?.value;
      if (!activeBranch) {
        console.log(`[Middleware] ⚠️ Cashier missing active_branch_id cookie. Bypassing direct redirect to avoid loop.`);
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/cashier-dashboard", req.url));
    }

    if (role === "customer") {
      return NextResponse.redirect(new URL("/customer-dashboard", req.url));
    }

    // 🔄 Rol henüz Clerk token'ında set edilmemişse (yeni patron, webhook gecikmesi)
    // JIT senkronizasyon sayfasına yönlendir; /api/auth/status polling ile self-healing yapar
    console.log(`[Middleware] 🔄 Role not yet resolved for userId=${userId}. Redirecting to /auth-callback for JIT sync.`);
    return NextResponse.redirect(new URL("/auth-callback", req.url));
  }

  // 🛡️ Hardened Gating: /create-organization
  if (pathname.startsWith("/create-organization")) {
    if (!isSuperAdmin) {
      console.warn(`[Middleware] 🛑 Gating: Only super admins can access /create-organization. Email: ${userEmail}`);
      return handleUnauthorized(req, pathname);
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 3. active_branch_id çerez enjeksiyonu (Next.js layout çerez set etme hatası çözümü)
  const isDashboardRoute = pathname.startsWith("/boss-dashboard") || 
                           pathname.startsWith("/manager-dashboard") || 
                           pathname.startsWith("/cashier-dashboard") || 
                           pathname.startsWith("/customer-dashboard") ||
                           pathname.startsWith("/dashboard");

  const activeBranchId = claims.metadata?.branch_id || claims.metadata?.branchId;
  const hasBranchCookie = req.cookies.has("active_branch_id");

  if (isDashboardRoute && activeBranchId && !hasBranchCookie) {
    console.log(`[Middleware] 🍪 active_branch_id çerezi bulunamadı. activeBranchId: ${activeBranchId} enjekte ediliyor.`);
    response.cookies.set("active_branch_id", activeBranchId, { path: "/", httpOnly: false });
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
//dosya sebebini boşver github push için yazdıpyurm