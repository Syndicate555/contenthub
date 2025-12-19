import { PrismaClient } from "../../src/generated/prisma/index.js";

const DEMO_USER_CLERK_ID = "demo_user_readonly";
const DEMO_USER_EMAIL = "demo@contenthub.app";

async function createDemoUser() {
  const prisma = new PrismaClient();

  try {
    console.log("Checking if demo user already exists...");

    const existingUser = await prisma.user.findUnique({
      where: { clerkId: DEMO_USER_CLERK_ID },
    });

    if (existingUser) {
      console.log("✅ Demo user already exists:", existingUser.id);
      return existingUser;
    }

    console.log("Creating demo user...");

    const demoUser = await prisma.user.create({
      data: {
        clerkId: DEMO_USER_CLERK_ID,
        email: DEMO_USER_EMAIL,
      },
    });

    console.log("✅ Demo user created successfully:", demoUser.id);
    console.log("   Clerk ID:", demoUser.clerkId);
    console.log("   Email:", demoUser.email);

    return demoUser;
  } catch (error) {
    console.error("❌ Failed to create demo user:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser();
