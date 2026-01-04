import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { validateSession } from "./lib/session-validation";

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/", // Landing page - publicly accessible
  "/sign-in(.*)",
  "/privacy", // Privacy policy - publicly accessible
  "/sitemap.xml", // SEO - must be publicly accessible for Google
  "/robots.txt", // SEO - must be publicly accessible for crawlers
  "/api/webhooks(.*)",
  "/api/quick-add", // Uses bearer token auth instead
  "/api/items(.*)", // Items API - supports both session cookies and bearer token auth
  "/api/domains", // Public - domains are global, not user-specific
  "/api/health(.*)", // Health check for function warming and monitoring
  "/video(.*)", // Serve static demo video without auth
  "/animations(.*)", // Serve lottie assets without auth
  "/wasm(.*)", // Serve wasm assets without auth
]);

// Proxy replaces the deprecated middleware convention in Next.js 16+
const proxy = clerkMiddleware(async (auth, request) => {
  const { userId, sessionId } = await auth();
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

  // Protect non-public routes
  if (!isPublicRoute(request)) {
    // For API routes, check auth manually and return JSON errors
    if (isApiRoute) {
      if (!userId || !sessionId) {
        return NextResponse.json(
          { ok: false, error: "Unauthorized - Session expired" },
          { status: 401 },
        );
      }

      // Server-side session validation for authenticated API requests
      const sessionValidation = await validateSession(userId, sessionId);

      if (!sessionValidation.valid) {
        return NextResponse.json(
          {
            ok: false,
            error: "Session expired",
            reason: sessionValidation.reason,
          },
          { status: 401 },
        );
      }
    } else {
      // For non-API routes, use standard auth.protect() which redirects
      await auth.protect();

      // Server-side session validation for authenticated page requests
      if (userId && sessionId) {
        const sessionValidation = await validateSession(userId, sessionId);

        if (!sessionValidation.valid) {
          const url = request.nextUrl.clone();
          url.pathname = "/sign-in";
          url.searchParams.set("reason", sessionValidation.reason ?? "unknown");
          return NextResponse.redirect(url);
        }
      }
    }
  }
});

export default proxy;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files (including .lottie and common video formats)
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|lottie|wasm|mp4|mov|m4v|webm)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
