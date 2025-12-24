import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes that don't require authentication
// Landing page and auth pages should be publicly accessible
const isPublicRoute = createRouteMatcher([
  "/", // Landing page - publicly accessible
  "/sign-in(.*)",
  "/api/webhooks(.*)",
  "/api/quick-add", // Uses bearer token auth instead
  "/api/domains", // Public - domains are global, not user-specific
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    // Added .lottie so animation assets bypass auth middleware
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|lottie)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
