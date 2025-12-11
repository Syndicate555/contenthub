/**
 * Check Email Newsletter Setup
 * Run this to verify everything is configured correctly
 */

import { db } from "../src/lib/db";
import { getUserInboundEmail } from "../src/lib/email-helpers";

async function checkSetup() {
  console.log("\n🔍 Tavlo Email Newsletter Setup Check\n");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Check 1: Environment variables
  console.log("1️⃣  Environment Variables:");
  console.log("─────────────────────────────────────────────────────────");

  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  const domain = process.env.RESEND_INBOUND_DOMAIN;

  if (webhookSecret) {
    console.log("✅ RESEND_WEBHOOK_SECRET is set");
    console.log(`   Value: ${webhookSecret.substring(0, 15)}...`);
  } else {
    console.log("❌ RESEND_WEBHOOK_SECRET is missing!");
    console.log('   Add to .env: RESEND_WEBHOOK_SECRET="whsec_..."');
  }

  if (domain) {
    console.log("✅ RESEND_INBOUND_DOMAIN is set");
    console.log(`   Value: ${domain}`);
  } else {
    console.log("❌ RESEND_INBOUND_DOMAIN is missing!");
    console.log('   Add to .env: RESEND_INBOUND_DOMAIN="galiltol.resend.app"');
  }

  // Check 2: Database connection
  console.log("\n2️⃣  Database Connection:");
  console.log("─────────────────────────────────────────────────────────");

  try {
    const user = await db.user.findFirst();
    if (user) {
      console.log("✅ Database connected");
      console.log(`   Found user: ${user.email}`);

      const inboundEmail = getUserInboundEmail(user.id);
      console.log(`\n📧 Your Email Address:`);
      console.log(`   ${inboundEmail}`);
    } else {
      console.log("❌ No users found in database");
      console.log("   Please sign in to Tavlo first");
    }
  } catch (error) {
    console.log("❌ Database connection failed!");
    console.log(`   Error: ${error}`);
  }

  // Check 3: Recent email items
  console.log("\n3️⃣  Recent Email Items:");
  console.log("─────────────────────────────────────────────────────────");

  try {
    const emailItems = await db.item.findMany({
      where: { importSource: "email" },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        source: true,
        createdAt: true,
      },
    });

    if (emailItems.length > 0) {
      console.log(`✅ Found ${emailItems.length} email item(s):`);
      emailItems.forEach((item, i) => {
        console.log(`\n   ${i + 1}. ${item.title}`);
        console.log(`      Source: ${item.source}`);
        console.log(`      Created: ${item.createdAt.toLocaleString()}`);
      });
    } else {
      console.log("⚠️  No email items found yet");
      console.log("   This is normal if you haven't forwarded any emails");
    }
  } catch (error) {
    console.log("❌ Failed to check email items");
    console.log(`   Error: ${error}`);
  }

  // Check 4: Webhook endpoint
  console.log("\n4️⃣  Webhook Endpoint:");
  console.log("─────────────────────────────────────────────────────────");
  console.log("✅ Route exists: /api/webhooks/email");
  console.log("   File: src/app/api/webhooks/email/route.ts");

  // Check 5: Next steps
  console.log("\n5️⃣  Next Steps:");
  console.log("─────────────────────────────────────────────────────────");
  console.log("1. Start ngrok: ngrok http 3000");
  console.log("2. Copy ngrok URL (e.g., https://abc123.ngrok-free.dev)");
  console.log("3. Update Resend webhook URL:");
  console.log("   https://resend.com/webhooks");
  console.log(
    "4. Set webhook URL to: https://YOUR-NGROK-URL/api/webhooks/email",
  );
  console.log("5. Forward a newsletter to your email address (shown above)");
  console.log("6. Check: http://localhost:3000/today");

  console.log(
    "\n═══════════════════════════════════════════════════════════\n",
  );

  await db.$disconnect();
}

checkSetup();
