/**
 * Test Resend API Connection
 * Checks if your API key is valid and account is active
 */

async function testResendAPI() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("❌ RESEND_API_KEY not found in .env");
    process.exit(1);
  }

  console.log("\n🔍 Testing Resend API Connection...\n");
  console.log("═══════════════════════════════════════════════════════════");

  try {
    // Test 1: Verify API key works
    console.log("\n1️⃣  Testing API Key Authentication:");
    console.log("─────────────────────────────────────────────────────────");

    const response = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ API Key is valid!");
      console.log(`   Found ${data.data?.length || 0} domain(s)`);

      if (data.data && data.data.length > 0) {
        console.log("\n📧 Your Domains:");
        data.data.forEach((domain: any) => {
          console.log(`   - ${domain.name} (Status: ${domain.status})`);
          if (domain.name.includes("galiltol")) {
            console.log(`     ✅ This is your inbound domain!`);
          }
        });
      }
    } else {
      const error = await response.text();
      console.log("❌ API Key validation failed");
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${error}`);
    }

    // Test 2: Check account status
    console.log("\n2️⃣  Account Information:");
    console.log("─────────────────────────────────────────────────────────");

    const accountResponse = await fetch("https://api.resend.com/emails", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (accountResponse.ok) {
      console.log("✅ Account is active and ready");
    } else {
      console.log("⚠️  Account might need verification");
      console.log("   Check your email for verification link");
    }

    // Test 3: Provide next steps
    console.log("\n3️⃣  Inbound Email Configuration:");
    console.log("─────────────────────────────────────────────────────────");
    console.log(
      "📧 Your inbound email: save+cmibd00vi000012mwuqlha0so@galiltol.resend.app",
    );
    console.log("\n⚠️  Important Notes:");
    console.log("   1. Resend's inbound email is in BETA");
    console.log("   2. You may need to request access to inbound features");
    console.log(
      "   3. The subdomain must be fully activated (can take 5-10 min)",
    );

    console.log("\n4️⃣  Next Steps:");
    console.log("─────────────────────────────────────────────────────────");
    console.log("1. ✅ Verify your email (check inbox for Resend email)");
    console.log("2. ⏳ Wait 5-10 minutes for domain activation");
    console.log("3. 📧 Send test email to: test@galiltol.resend.app");
    console.log("4. 🔍 Check Resend dashboard: https://resend.com/emails");
    console.log(
      "5. 📝 If still not working, contact Resend support to enable inbound",
    );

    console.log(
      "\n═══════════════════════════════════════════════════════════\n",
    );
  } catch (error) {
    console.error("❌ Error testing Resend API:", error);
  }
}

testResendAPI();
