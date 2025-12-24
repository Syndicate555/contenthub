import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/", // Landing page - publicly accessible
  "/sign-in(.*)",
  "/api/webhooks(.*)",
  "/api/quick-add", // Uses bearer token auth instead
  "/api/domains", // Public - domains are global, not user-specific
  "/video(.*)", // Serve static demo video without auth
  "/animations(.*)", // Serve lottie assets without auth
]);

// Proxy replaces the deprecated middleware convention in Next.js 16+
const proxy = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export default proxy;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files (including .lottie and common video formats)
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|lottie|mp4|mov|m4v|webm)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
