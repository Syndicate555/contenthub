import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";

/**
 * Get the current user from database, creating them if they don't exist.
 * This ensures users are synced even without the Clerk webhook.
 */
export async function getCurrentUser() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  // Try to find existing user
  let user = await db.user.findUnique({
    where: { clerkId },
  });

  // If user doesn't exist, create them
  if (!user) {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || "";

    user = await db.user.create({
      data: {
        clerkId,
        email,
      },
    });
  }

  return user;
}
