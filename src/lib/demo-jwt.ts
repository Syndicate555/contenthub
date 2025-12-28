import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";

export const DEMO_USER_CLERK_ID = "demo_user_readonly";
export const DEMO_TOKEN_EXPIRY_MINUTES = 30; // Changed from 24 hours to 30 minutes

type DemoTokenPayload = {
  type: "demo";
  userId: string;
  tokenId: string; // Unique token ID for tracking
  iat: number;
  exp: number;
};

function getDemoJwtSecret(): string {
  const secret = process.env.DEMO_JWT_SECRET;
  if (!secret) {
    throw new Error("DEMO_JWT_SECRET environment variable is not set");
  }
  return secret;
}

export function createDemoToken(
  userId: string,
  expiresInMinutes: number = DEMO_TOKEN_EXPIRY_MINUTES,
): string {
  const secret = getDemoJwtSecret();

  // Generate unique token ID for tracking
  const tokenId = randomBytes(16).toString("hex");

  const payload = {
    type: "demo" as const,
    userId,
    tokenId,
  };

  const token = jwt.sign(payload, secret, {
    expiresIn: `${expiresInMinutes}m`,
  });

  return token;
}

export function verifyDemoToken(token: string): DemoTokenPayload | null {
  try {
    const secret = getDemoJwtSecret();
    const payload = jwt.verify(token, secret) as DemoTokenPayload;

    if (payload.type !== "demo") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Get remaining time in seconds for a demo token
 * Returns null if token is expired or invalid
 */
export function getRemainingTime(payload: DemoTokenPayload): number | null {
  const now = Math.floor(Date.now() / 1000);
  const remaining = payload.exp - now;

  if (remaining <= 0) {
    return null; // Expired
  }

  return remaining;
}
