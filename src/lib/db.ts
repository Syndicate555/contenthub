import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  const maskedUrl = dbUrl.replace(/:[^:@]*@/, ":****@");
  console.log(`[DB] Initializing Prisma with URL: ${maskedUrl}`);
} else {
  console.error("[DB] DATABASE_URL is missing!");
}

// In development, prefer DIRECT_URL (port 5432) to avoid transaction pooler timeouts/blocks on port 6543
const connectionUrl =
  process.env.NODE_ENV === "development" && process.env.DIRECT_URL
    ? process.env.DIRECT_URL
    : process.env.DATABASE_URL;

if (process.env.NODE_ENV === "development") {
  console.log(
    `[DB] Using connection: ${connectionUrl?.replace(/:[^:@]*@/, ":****@")}`,
  );
}

// Create Prisma client optimized for serverless
// Connection pooling is handled by:
// 1. PgBouncer (transaction pooler on port 6543) in DATABASE_URL
// 2. DIRECT_URL (direct connection on port 5432) for dev to avoid pooler issues
// 3. Singleton pattern (globalForPrisma) to reuse client across invocations
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
  });

// Graceful shutdown handler for serverless
if (process.env.NODE_ENV === "production") {
  // Ensure connections are cleaned up on function termination
  const cleanup = async () => {
    try {
      await db.$disconnect();
      console.log("[DB] Prisma disconnected gracefully");
    } catch (error) {
      console.error("[DB] Error during Prisma disconnect:", error);
    }
  };

  // Handle various termination signals
  process.on("SIGTERM", cleanup);
  process.on("SIGINT", cleanup);
  process.on("beforeExit", cleanup);
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Alias for consistency with common naming convention
export const prisma = db;
