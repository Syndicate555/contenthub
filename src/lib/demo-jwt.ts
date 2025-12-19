import jwt from "jsonwebtoken";

export const DEMO_USER_CLERK_ID = "demo_user_readonly";

type DemoTokenPayload = {
  type: "demo";
  userId: string;
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
  expiresInHours: number = 24,
): string {
  const secret = getDemoJwtSecret();

  const payload = {
    type: "demo" as const,
    userId,
  };

  const token = jwt.sign(payload, secret, {
    expiresIn: `${expiresInHours}h`,
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
