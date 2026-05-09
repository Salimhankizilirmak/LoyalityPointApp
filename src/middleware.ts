import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// İzin verilen Süper Admin e-posta anahtar kelimeleri
const SUPER_ADMIN_EMAILS = [
  "aleprensongut",
  "salimhankizilirmak", // Türkçe karakterleri replace ederek veya exact match yaparak kullanabiliriz
  "salimhankızılırmak",
  "novexistech"
];

// Gizli süper admin URL'si
const isSuperAdminRoute = createRouteMatcher(["/sys-core-admin-7f9a2b8c(.*)"]);

// Herkese açık rotalar
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  if (isSuperAdminRoute(req)) {
    // Clerk dashboard üzerinden sessionClaims içine email ve role eklenmesi gerekmektedir.
    // Örn: { "role": "user.publicMetadata.role", "email": "user.primaryEmailAddress" }
    const role = (sessionClaims?.metadata as any)?.role;
    const email = (sessionClaims as any)?.email as string | undefined;

    const isEmailWhitelisted = email && SUPER_ADMIN_EMAILS.some(whitelistEmail => email.includes(whitelistEmail));

    if (role !== "superadmin" || !isEmailWhitelisted) {
      // Yetkisiz girişi engelle ve anasayfaya yönlendir
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Next.js statik dosyaları ve imageleri hariç tut
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // API rotalarını her zaman çalıştır
    "/(api|trpc)(.*)",
  ],
};
