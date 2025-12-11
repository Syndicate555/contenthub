import { db } from "../src/lib/db";
import { getUserInboundEmail } from "../src/lib/email-helpers";

async function getUserEmailAddress() {
  const user = await db.user.findFirst();

  if (!user) {
    console.log("❌ No user found. Please sign in first.");
    return;
  }

  const inboundEmail = getUserInboundEmail(user.id);

  console.log("\n✅ Your User Info:");
  console.log("═══════════════════════════════════════");
  console.log("Email:", user.email);
  console.log("User ID:", user.id);
  console.log("\n📧 Your Personalized Email Address:");
  console.log("═══════════════════════════════════════");
  console.log(inboundEmail);
  console.log("\n💡 Forward newsletters to this address!");
  console.log("   Once Resend is configured, any email");
  console.log("   sent here will be saved to Tavlo.");
  console.log("═══════════════════════════════════════\n");

  await db.$disconnect();
}

getUserEmailAddress();
