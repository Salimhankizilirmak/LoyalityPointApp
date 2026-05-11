import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/", "/unauthorized", "/org-disabled"]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // 1. Herkes için açık olan sayfalar
  if (isPublicRoute(req)) {
    const { userId } = await auth();
    // Giriş yapmış kullanıcıyı giriş sayfalarından dashboard'a yönlendir
    if (userId && (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 2. Korumalı sayfalar için oturum kontrolü
  const { userId, redirectToSignIn, sessionClaims } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: "/dashboard" });
  }

  // 3. GÜVENLİK KONTROLÜ:
  // Middleware katmanında e-posta bazen sessionClaims içinde eksik olabilir.
  // Bu nedenle ana yetkilendirme kontrolünü /dashboard sayfasındaki Server Component'e bırakıyoruz.
  // Ancak, rolü ve organizasyonu olmayan kullanıcıların iç sayfalara (dashboard dışı) 
  // direkt erişimini burada kısıtlıyoruz.
  
  const role = (sessionClaims?.metadata as any)?.role;
  const orgId = sessionClaims?.orgId;
  
  // Ana yetkilendirme rotaları
  const isCoreAuthPage = pathname === "/dashboard" || pathname.startsWith("/admin") || pathname === "/create-organization";

  // Eğer kullanıcı Süper Admin değilse (metadata boşsa) ve organizasyona bağlı değilse
  // ve ana yetkilendirme sayfasında değilse engelle.
  if (!role && !orgId && !isCoreAuthPage) {
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
