import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/", "/unauthorized", "/org-disabled"]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // 1. Herkes için açık olan sayfalar
  if (isPublicRoute(req)) {
    const { userId, sessionClaims } = await auth();
    // Giriş yapmış kullanıcıyı giriş sayfalarından dashboard'a yönlendir
    if (userId && (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 2. Korumalı sayfalar için oturum kontrolü
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: "/dashboard" });
  }

  // 3. KRİTİK GÜVENLİK: Davetsiz Kullanıcı Engelleme (Zero-Tolerance)
  // Süper Admin e-postalarını kontrol et
  const userEmail = (sessionClaims?.email as string)?.toLowerCase() || "";
  const envEmails = process.env.SUPER_ADMIN_EMAILS || "";
  const allowedEmails = envEmails.split(",").map(e => e.trim().toLowerCase());
  const isSuperAdmin = allowedEmails.includes(userEmail);

  const role = (sessionClaims?.metadata as any)?.role;
  const orgId = sessionClaims?.orgId;

  // Eğer kullanıcı Süper Admin değilse VE (Rolü yok VE Organizasyonu yoksa)
  if (!isSuperAdmin && !role && !orgId) {
    // Bu kullanıcı davetsiz gelmiş bir 'intruder'dır.
    // Dashboard'a gitmesine veya herhangi bir onboard ekranı görmesine izin verme.
    if (pathname !== "/unauthorized") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
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
