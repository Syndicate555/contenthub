/**
 * Test Email Webhook Locally
 *
 * This script simulates a Resend webhook to test email processing without needing
 * Resend account or ngrok setup.
 *
 * Usage: npx tsx scripts/test-email-webhook.ts
 */

import { processEmailItem } from "../src/lib/email-processor";
import { db } from "../src/lib/db";

async function testEmailWebhook() {
  console.log("🧪 Testing Email Webhook Processing...\n");

  // Step 1: Get a test user
  const user = await db.user.findFirst();

  if (!user) {
    console.error("❌ No users found in database. Please sign up first at http://localhost:3000");
    process.exit(1);
  }

  console.log(`✅ Found test user: ${user.email} (ID: ${user.id})\n`);

  // Step 2: Create a fake newsletter email
  const fakeNewsletter = {
    to: `save+${user.id}@resend.dev`,
    from: "newsletter@morningbrew.com",
    subject: "Morning Brew: Your Daily Dose of Tech News",
    html: `
      <html>
        <body>
          <h1>Top Stories Today</h1>
          <p>Here are today's most important tech stories:</p>

          <h2>1. AI Breakthrough in Healthcare</h2>
          <p>Researchers at MIT have developed a new AI model that can predict
          disease onset 5 years before symptoms appear. The model analyzes
          patient data and genetic markers with 95% accuracy.</p>

          <h2>2. Quantum Computing Goes Mainstream</h2>
          <p>Google announces cloud-based quantum computing service available
          to enterprises. The service promises 1000x faster processing for
          specific optimization problems.</p>

          <h2>3. Sustainable Tech Revolution</h2>
          <p>Major tech companies commit to carbon-neutral data centers by 2025.
          Apple, Microsoft, and Amazon lead the initiative with $10B investment.</p>

          <img src="tracking.gif" width="1" height="1" />
          <a href="https://unsubscribe.example.com">Unsubscribe</a>
        </body>
      </html>
    `,
    text: `
Top Stories Today

1. AI Breakthrough in Healthcare
Researchers at MIT have developed a new AI model that can predict
disease onset 5 years before symptoms appear.

2. Quantum Computing Goes Mainstream
Google announces cloud-based quantum computing service.

3. Sustainable Tech Revolution
Major tech companies commit to carbon-neutral data centers by 2025.
    `,
    headers: {
      "message-id": `<test-${Date.now()}@morningbrew.com>`,
      "from": "newsletter@morningbrew.com",
      "to": `save+${user.id}@resend.dev`,
    },
  };

  console.log("📧 Simulated Newsletter:");
  console.log(`   From: ${fakeNewsletter.from}`);
  console.log(`   To: ${fakeNewsletter.to}`);
  console.log(`   Subject: ${fakeNewsletter.subject}`);
  console.log(`   Message-ID: ${fakeNewsletter.headers["message-id"]}\n`);

  // Step 3: Process the email
  console.log("⚙️  Processing email through pipeline...\n");

  try {
    await processEmailItem(fakeNewsletter);
    console.log("\n✅ Email processed successfully!");
    console.log("\n🎉 Check your items at: http://localhost:3000/today");
    console.log("   The newsletter should appear with AI-generated summary, tags, and category!");
  } catch (error) {
    console.error("\n❌ Error processing email:", error);
    process.exit(1);
  }
}

testEmailWebhook()
  .then(() => {
    console.log("\n✨ Test completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
