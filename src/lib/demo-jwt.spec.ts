import { describe, expect, test, beforeAll } from "vitest";
import {
  createDemoToken,
  verifyDemoToken,
  DEMO_USER_CLERK_ID,
} from "./demo-jwt";

const mockUserId = "test-user-id-123";
const mockSecret = "test-secret-key-for-demo-tokens";

describe("createDemoToken", () => {
  beforeAll(() => {
    process.env.DEMO_JWT_SECRET = mockSecret;
  });

  test("creates a valid JWT token with demo type", () => {
    const token = createDemoToken(mockUserId);

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);
  });

  test("creates token that expires in 24 hours", () => {
    const token = createDemoToken(mockUserId);
    const payload = verifyDemoToken(token);

    expect(payload).toBeDefined();
    expect(payload!.exp).toBeDefined();

    const now = Math.floor(Date.now() / 1000);
    const expectedExpiry = now + 24 * 60 * 60;
    const tolerance = 5;

    expect(payload!.exp).toBeGreaterThanOrEqual(expectedExpiry - tolerance);
    expect(payload!.exp).toBeLessThanOrEqual(expectedExpiry + tolerance);
  });

  test("includes correct payload structure", () => {
    const token = createDemoToken(mockUserId);
    const payload = verifyDemoToken(token);

    expect(payload).toMatchObject({
      type: "demo",
      userId: mockUserId,
    });
  });
});

describe("verifyDemoToken", () => {
  beforeAll(() => {
    process.env.DEMO_JWT_SECRET = mockSecret;
  });

  test("successfully verifies a valid token", () => {
    const token = createDemoToken(mockUserId);
    const payload = verifyDemoToken(token);

    expect(payload).toBeDefined();
    expect(payload!.type).toBe("demo");
    expect(payload!.userId).toBe(mockUserId);
  });

  test("returns null for invalid token", () => {
    const invalidToken = "invalid.token.here";
    const payload = verifyDemoToken(invalidToken);

    expect(payload).toBeNull();
  });

  test("returns null for expired token", () => {
    const expiredToken = createDemoToken(mockUserId, -1);
    const payload = verifyDemoToken(expiredToken);

    expect(payload).toBeNull();
  });

  test("returns null for token with wrong secret", () => {
    process.env.DEMO_JWT_SECRET = "different-secret";
    const token = createDemoToken(mockUserId);

    process.env.DEMO_JWT_SECRET = "wrong-secret";
    const payload = verifyDemoToken(token);

    expect(payload).toBeNull();

    process.env.DEMO_JWT_SECRET = mockSecret;
  });
});

describe("DEMO_USER_CLERK_ID", () => {
  test("is defined and is a string", () => {
    expect(DEMO_USER_CLERK_ID).toBeDefined();
    expect(typeof DEMO_USER_CLERK_ID).toBe("string");
    expect(DEMO_USER_CLERK_ID.length).toBeGreaterThan(0);
  });
});
