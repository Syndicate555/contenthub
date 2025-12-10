/**
 * Diagnostic script to check which user an email address belongs to
 * Run: npx tsx scripts/check-user-email.ts
 */

import { db } from "../src/lib/db";
import { getUserInboundEmail } from "../src/lib/email-helpers";

async function checkUserEmail() {
  try {
    // Get all users
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        clerkId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (users.length === 0) {
      console.log("❌ No users found in database");
      return;
    }

    console.log("\n📋 All ContentHub Users & Their Forwarding Emails:");
    console.log(
      "═══════════════════════════════════════════════════════════════\n",
    );

    for (const user of users) {
      const inboundEmail = getUserInboundEmail(user.id);
      console.log(`👤 ${user.email}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   📧 Forward newsletters to: ${inboundEmail}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log("");
    }

    // Check the most recent email item
    const recentEmailItem = await db.item.findFirst({
      where: {
        importSource: "email",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (recentEmailItem) {
      console.log(
        "═══════════════════════════════════════════════════════════════",
      );
      console.log("📧 Most Recent Email Item Was Assigned To:");
      console.log(
        "═══════════════════════════════════════════════════════════════\n",
      );
      console.log(`👤 User Email: ${recentEmailItem.user.email}`);
      console.log(`   User ID: ${recentEmailItem.userId}`);
      console.log(
        `   Expected Forwarding Address: ${getUserInboundEmail(recentEmailItem.userId)}`,
      );
      console.log(`\n📩 Email Details:`);
      console.log(`   Subject: ${recentEmailItem.title}`);
      console.log(`   Source: ${recentEmailItem.source}`);
      console.log(`   Created: ${recentEmailItem.createdAt}`);
      console.log("");
    }

    console.log(
      "═══════════════════════════════════════════════════════════════\n",
    );
    console.log("💡 Troubleshooting Tips:");
    console.log(
      "─────────────────────────────────────────────────────────────",
    );
    console.log(
      "1. Make sure you're logged into ContentHub with the SAME email",
    );
    console.log("   as the user whose forwarding address you're using");
    console.log("");
    console.log(
      "2. Double-check the forwarding address includes the correct user ID",
    );
    console.log("   Format: save+{userId}@galiitol.resend.app");
    console.log("");
    console.log(
      "3. Each user has a unique forwarding address - using the wrong",
    );
    console.log("   one will send the email to a different account!");
    console.log("");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.$disconnect();
  }
}

checkUserEmail();
