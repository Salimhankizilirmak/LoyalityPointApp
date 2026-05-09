import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Herkese açık rotalar
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();

  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
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
