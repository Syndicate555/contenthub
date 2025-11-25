import { NextRequest } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { processEmailItem, type EmailData } from "@/lib/email-processor";

/**
 * Resend Inbound Email Webhook Handler
 *
 * Receives forwarded newsletters from Resend and processes them into Items.
 *
 * Flow:
 * 1. User forwards newsletter to save+{userId}@resend.dev
 * 2. Resend parses email and sends webhook to this endpoint
 * 3. Verify webhook signature using Svix
 * 4. Extract email data (subject, body, sender, Message-ID)
 * 5. Process through email processor → creates Item → runs pipeline
 *
 * Security:
 * - Svix signature verification (same library as Clerk webhooks)
 * - Returns 200 even on errors to prevent infinite retries
 * - User-specific email addresses prevent cross-user spam
 *
 * @see https://resend.com/docs/api-reference/emails/webhooks
 */
export async function POST(request: NextRequest) {
  const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing RESEND_WEBHOOK_SECRET environment variable");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Get Svix headers (Resend uses Svix for webhook signing)
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing Svix headers in webhook request");
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get the request body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Verify the webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: ResendInboundEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ResendInboundEvent;
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }

  // Only handle email.received events
  if (evt.type !== "email.received") {
    console.log(`Ignoring webhook event type: ${evt.type}`);
    return new Response("OK", { status: 200 });
  }

  console.log(`Received email webhook: from=${evt.data.from}, to=${evt.data.to}, subject="${evt.data.subject}"`);

  // Process the email asynchronously
  try {
    await processEmailItem(evt.data);
    return new Response("OK", { status: 200 });
  } catch (error) {
    // Log error but return 200 to prevent Resend from retrying indefinitely
    // The email processor already handles errors gracefully
    console.error("Email processing failed:", error);
    return new Response("OK", { status: 200 });
  }
}

/**
 * Resend webhook event type
 * Based on Resend Inbound Email API specification
 *
 * @see https://resend.com/docs/api-reference/emails/webhooks
 */
interface ResendInboundEvent {
  type: "email.received" | "email.sent" | "email.delivered" | "email.bounced";
  created_at: string;
  data: EmailData;
}
