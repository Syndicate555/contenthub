import { db } from "./db";
import { convert } from "html-to-text";
import { summarizeContent } from "./openai";
import { getDomainForContent } from "./domains";
import { awardXP, XP_ACTIONS } from "./xp";
import { updateStreak } from "./streak";
import { checkAllBadges } from "./badges";
import { truncateContent } from "./extractor";

export interface EmailData {
  to: string | string[]; // save+userid@resend.dev (can be array or string)
  from: string; // sender@example.com
  subject: string;
  html?: string; // Optional - may not be in webhook payload
  text?: string; // Optional - may not be in webhook payload
  message_id: string; // Resend uses message_id (with underscore)
  email_id: string; // Resend's internal email ID
  created_at?: string;
  attachments?: any[];
  bcc?: string[];
  cc?: string[];
  reply_to?: string;
}

/**
 * Process an inbound email and convert it to an Item
 * Extracts user ID from email address, parses content, and runs through pipeline
 *
 * Flow:
 * 1. Extract user ID from email address (save+{userId}@domain)
 * 2. Verify user exists in database
 * 3. Extract Message-ID for deduplication
 * 4. Check for duplicate emails
 * 5. Parse newsletter content (HTML → text)
 * 6. Create Item record
 * 7. Run through existing processItem() pipeline (AI, XP, streaks, badges)
 */
export async function processEmailItem(emailData: EmailData): Promise<void> {
  // Handle 'to' field as either string or array
  const toAddress = Array.isArray(emailData.to)
    ? emailData.to[0]
    : emailData.to;

  console.log(`Processing email from ${emailData.from} to ${toAddress}`);

  // Step 1: Extract user ID from email address
  const userId = extractUserIdFromEmail(toAddress);

  if (!userId) {
    console.error(`Failed to extract user ID from email: ${toAddress}`);
    return;
  }

  // Step 2: Verify user exists
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.error(`User not found: ${userId}`);
    return;
  }

  // Step 3: Extract Message-ID for deduplication
  const messageId =
    emailData.message_id || generateFallbackMessageId(emailData);

  if (!messageId) {
    console.error("Email missing Message-ID and fallback generation failed");
    return;
  }

  // Step 4: Check for duplicate
  const existingItem = await db.item.findUnique({
    where: {
      userId_importSource_externalId: {
        userId,
        importSource: "email",
        externalId: messageId,
      },
    },
  });

  if (existingItem) {
    console.log(
      `Duplicate email detected (Message-ID: ${messageId}), skipping`,
    );
    return;
  }

  // Step 5: Fetch email content if not provided in webhook
  if (!emailData.html && !emailData.text) {
    console.log(`Email content not in webhook payload, fetching from API...`);

    const emailContent = await fetchEmailFromResend(emailData.email_id);

    if (!emailContent) {
      console.error(
        "❌ Failed to fetch email content from Resend API. Cannot process email without content.",
      );
      return; // STOP PROCESSING - no content means no value to the user
    }

    emailData.html = emailContent.html;
    emailData.text = emailContent.text;
  }

  // Step 6: Extract newsletter content
  const content = extractNewsletterContent(emailData);

  // Step 6.1: Validate we have substantive content
  if (!content.text || content.text.trim().length < 50) {
    console.error("❌ CRITICAL: Email content is too short or empty");
    console.error(`Content length: ${content.text?.length || 0} characters`);
    console.error(
      "Cannot provide value to user without substantive content. Aborting.",
    );
    return; // STOP PROCESSING - minimal content isn't worth saving
  }

  console.log(`✅ Email content extracted: ${content.text.length} characters`);

  // Step 6: Extract sender domain for source
  const senderDomain = extractDomain(emailData.from);

  // Step 7: Generate URL (use sender domain as reference)
  const url = `https://${senderDomain}`;

  console.log(
    `Creating email item: subject="${emailData.subject.substring(
      0,
      50,
    )}...", source=${senderDomain}`,
  );

  // Step 8: Create Item record with email metadata
  const item = await db.item.create({
    data: {
      userId,
      url,
      source: senderDomain,
      importSource: "email",
      externalId: messageId,
      title: emailData.subject,
      rawContent: content.text,
      status: "new",
    },
  });

  console.log(`Email item created: ${item.id} from ${emailData.from}`);

  // Step 9: Award XP for saving the item
  try {
    await awardXP({
      userId,
      action: XP_ACTIONS.SAVE_ITEM,
      itemId: item.id,
      metadata: { url, source: senderDomain },
    });
  } catch (xpError) {
    console.error("Failed to award save XP:", xpError);
  }

  // Step 10: Summarize content with OpenAI
  try {
    console.log("Summarizing email content with AI...");
    const truncated = truncateContent(content.text);

    const summarized = await summarizeContent({
      title: emailData.subject,
      content: truncated,
      url,
      source: senderDomain,
      userNote: undefined,
    });

    // Step 11: Determine domain from category and tags
    const domainId = await getDomainForContent(
      summarized.category,
      summarized.tags,
    );

    // Step 12: Update item with AI-processed data
    const updatedItem = await db.item.update({
      where: { id: item.id },
      data: {
        title: summarized.title,
        summary: summarized.summary.join("\n"),
        tags: summarized.tags,
        type: summarized.type,
        category: summarized.category,
        domainId: domainId || undefined,
      },
    });

    console.log(`Email item processed with AI: ${updatedItem.id}`);

    // Step 13: Award XP for processing
    try {
      await awardXP({
        userId,
        action: XP_ACTIONS.PROCESS_ITEM,
        domainId: domainId || undefined,
        itemId: item.id,
        metadata: {
          category: summarized.category,
          tags: summarized.tags,
          type: summarized.type,
        },
      });
    } catch (xpError) {
      console.error("Failed to award process XP:", xpError);
    }

    // Step 14: Update streak
    try {
      await updateStreak(userId);
    } catch (streakError) {
      console.error("Failed to update streak:", streakError);
    }

    // Step 15: Check badges
    try {
      const newBadges = await checkAllBadges(userId);
      if (newBadges.length > 0) {
        console.log(
          `Badges awarded: ${newBadges.map((b) => b.name).join(", ")}`,
        );
      }
    } catch (badgeError) {
      console.error("Failed to check badges:", badgeError);
    }

    console.log(`Email processing completed successfully: ${item.id}`);
  } catch (error) {
    console.error(`AI processing failed for email ${messageId}:`, error);
    // Item is already created with basic info, so partial success
    // User can still see the email content even if AI processing failed
  }
}

/**
 * Extract user ID from email address
 * Supports: save+userid@domain.com
 *
 * @param emailAddress - The recipient email address
 * @returns User ID or null if not found
 *
 * @example
 * extractUserIdFromEmail("save+cm123abc@resend.dev") // → "cm123abc"
 */
function extractUserIdFromEmail(emailAddress: string): string | null {
  // Format: save+userid@domain.com
  const match = emailAddress.match(/save\+([^@]+)@/);

  if (match && match[1]) {
    return match[1];
  }

  // Fallback: if no +userid, could implement default user logic
  // For now, require explicit user ID
  return null;
}

/**
 * Extract domain from email address
 *
 * @param email - Email address
 * @returns Domain name
 *
 * @example
 * extractDomain("newsletter@substack.com") // → "substack.com"
 */
function extractDomain(email: string): string {
  const match = email.match(/@(.+)$/);
  return match ? match[1] : "unknown";
}

/**
 * Extract newsletter content from email
 * Prioritizes plain text, falls back to HTML → text conversion
 *
 * @param emailData - Email data from Resend webhook
 * @returns Extracted text content and metadata
 */
function extractNewsletterContent(emailData: EmailData): {
  text: string;
  hasHtml: boolean;
} {
  // Prefer plain text if available and substantive
  if (emailData.text && emailData.text.trim().length > 100) {
    return {
      text: cleanEmailText(emailData.text),
      hasHtml: false,
    };
  }

  // Fall back to HTML → plain text conversion
  if (emailData.html) {
    const text = convert(emailData.html, {
      wordwrap: false,
      selectors: [
        // Remove tracking pixels (1x1 images)
        { selector: "img[width='1']", format: "skip" },
        { selector: "img[height='1']", format: "skip" },
        // Remove footer sections
        { selector: ".footer", format: "skip" },
        { selector: "#footer", format: "skip" },
        // Remove unsubscribe links
        { selector: 'a[href*="unsubscribe"]', format: "skip" },
        // Preserve important elements
        { selector: "a", options: { ignoreHref: false } },
      ],
    });

    return {
      text: cleanEmailText(text),
      hasHtml: true,
    };
  }

  // Fallback: use subject as content
  return {
    text: emailData.subject,
    hasHtml: false,
  };
}

/**
 * Clean up email text content
 * Removes excessive whitespace, email signatures, forwarding headers
 *
 * @param text - Raw email text
 * @returns Cleaned text
 */
function cleanEmailText(text: string): string {
  let cleaned = text;

  // Remove forwarding headers (e.g., "Forwarded message:")
  cleaned = cleaned.replace(/^-+\s*Forwarded message\s*-+$/gim, "");
  cleaned = cleaned.replace(/^From:.*$/gim, "");
  cleaned = cleaned.replace(/^Date:.*$/gim, "");
  cleaned = cleaned.replace(/^Subject:.*$/gim, "");
  cleaned = cleaned.replace(/^To:.*$/gim, "");

  // Remove excessive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // Trim
  cleaned = cleaned.trim();

  // Truncate to 10,000 characters (reasonable limit for newsletters)
  if (cleaned.length > 10000) {
    cleaned = cleaned.slice(0, 10000) + "\n\n[Content truncated...]";
  }

  return cleaned;
}

/**
 * Fetch email content from Resend's inbound email API
 * Uses the /emails/receiving/{id} endpoint which provides HTML and text content
 *
 * @param emailId - The email ID from the webhook payload
 * @returns Email content (html and text) or null if fetch fails
 */
async function fetchEmailFromResend(
  emailId: string,
): Promise<{ html: string; text: string } | null> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("RESEND_API_KEY not configured");
    return null;
  }

  try {
    console.log(`Fetching email content for ID: ${emailId}`);

    const response = await fetch(
      `https://api.resend.com/emails/receiving/${emailId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to fetch email from Resend: ${response.status} ${response.statusText}`,
      );
      console.error(`Response: ${errorText}`);
      return null;
    }

    const data = await response.json();

    // Validate that we got content
    if (!data.html && !data.text) {
      console.error("Email content is empty from Resend API");
      return null;
    }

    console.log(
      `✅ Successfully fetched email content: ${
        data.text?.length || 0
      } chars text, ${data.html?.length || 0} chars HTML`,
    );

    return {
      html: data.html || "",
      text: data.text || "",
    };
  } catch (error) {
    console.error("Error fetching email from Resend:", error);
    return null;
  }
}

function generateFallbackMessageId(emailData: EmailData): string {
  const timestamp = Date.now();
  const toAddress = Array.isArray(emailData.to)
    ? emailData.to[0]
    : emailData.to;
  const uniqueString = `${toAddress}${emailData.from}${emailData.subject}${timestamp}`;
  const base64 = Buffer.from(uniqueString).toString("base64");
  return `<generated-${base64}@contenthub.app>`;
}
