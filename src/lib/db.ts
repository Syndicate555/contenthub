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

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Alias for consistency with common naming convention
export const prisma = db;
