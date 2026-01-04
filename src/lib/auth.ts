import { auth, currentUser } from "@clerk/nextjs/server";
import { headers, cookies } from "next/headers";
import { db } from "./db";
import { verifyDemoToken, DEMO_USER_CLERK_ID } from "./demo-jwt";
import type { User } from "@/generated/prisma";

/**
 * Get the current user from database, creating them if they don't exist.
 * This ensures users are synced even without the Clerk webhook.
 *
 * Also supports demo mode via Bearer token in Authorization header
 * or impersonation cookie (dev only).
 */
export async function getCurrentUser() {
  // Check for demo impersonation cookie (dev only)
  // WARNING: Only for development! Allows adding content to demo account
  if (process.env.NODE_ENV === "development") {
    try {
      const cookieStore = await cookies();
      const impersonationToken = cookieStore.get("demo_impersonation_token");

      if (impersonationToken?.value) {
        const payload = verifyDemoToken(impersonationToken.value);

        if (payload) {
          const demoUser = await db.user.findUnique({
            where: { id: payload.userId },
          });

          if (demoUser) {
            console.log(
              "[DEV] Impersonating demo user:",
              demoUser.email,
              "- Clear cookie to return to your account",
            );
            return demoUser;
          }
        }
      }
    } catch (error) {
      console.error("[DEV] Failed to check impersonation cookie:", error);
      // Continue to regular auth on error
    }
  }

  // Check for Bearer token (mobile demo mode or extension)
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");

    // Try demo token first
    const demoPayload = verifyDemoToken(token);
    if (demoPayload) {
      const demoUser = await db.user.findUnique({
        where: { id: demoPayload.userId },
      });

      if (demoUser) {
        return demoUser;
      }
    }

    // Try Clerk JWT token (for extension)
    try {
      // Use Clerk's JWT verification for custom templates
      const { verifyToken } = await import("@clerk/nextjs/server");

      if (!process.env.CLERK_SECRET_KEY) {
        throw new Error("CLERK_SECRET_KEY not configured");
      }

      const verified = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      if (verified?.sub) {
        let user = await db.user.findUnique({
          where: { clerkId: verified.sub },
        });

        // If user doesn't exist yet, create them
        if (!user) {
          // Get email from JWT payload (Clerk includes it in custom claims)
          // The email is typically in the 'email' claim or we can leave it empty
          // and let it be updated when user logs in via the web
          const email = (verified.email as string | undefined) || "";

          try {
            user = await db.user.create({
              data: {
                clerkId: verified.sub,
                email,
              },
            });
          } catch (error: unknown) {
            if (
              error &&
              typeof error === "object" &&
              "code" in error &&
              error.code === "P2002"
            ) {
              user = await db.user.findUnique({
                where: { clerkId: verified.sub },
              });

              if (!user) {
                throw error;
              }
            } else {
              throw error;
            }
          }
        }

        if (user) {
          return user;
        }
      }
    } catch (error) {
      console.error("[Auth] Failed to verify Clerk JWT from Bearer token:", error);
      console.error("[Auth] Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Continue to regular session auth
    }
  }

  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  let user = await db.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || "";

    try {
      user = await db.user.create({
        data: {
          clerkId,
          email,
        },
      });
    } catch (error: unknown) {
      // Handle race condition: another request might have created the user
      // between our findUnique check and create attempt
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ) {
        // Unique constraint failed - user was created by parallel request
        // Retry the findUnique to get the created user
        user = await db.user.findUnique({
          where: { clerkId },
        });

        if (!user) {
          // This should never happen, but throw original error if it does
          throw error;
        }
      } else {
        // Not a unique constraint error, rethrow
        throw error;
      }
    }
  }

  return user;
}

/**
 * Check if a user is the demo user.
 */
export function isDemoUser(user: User | null): boolean {
  if (!user) return false;
  return user.clerkId === DEMO_USER_CLERK_ID;
}

/**
 * Throws an error if the user is a demo user (read-only).
 * Use this to protect write operations.
 *
 * In development, allows writes when impersonating to populate demo content.
 */
export async function assertNotDemoUser(user: User | null): Promise<void> {
  if (!isDemoUser(user)) {
    return;
  }

  // In development, allow writes if using impersonation cookie
  if (process.env.NODE_ENV === "development") {
    const cookieStore = await cookies();
    const impersonationToken = cookieStore.get("demo_impersonation_token");

    if (impersonationToken?.value) {
      // Allow writes when impersonating in dev
      return;
    }
  }

  throw new Error("Demo mode is read-only. Sign in to save changes.");
}
