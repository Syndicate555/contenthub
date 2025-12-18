import OpenAI from "openai";
import type { SummarizerOutput, ItemType, ItemCategory } from "@/types";
import { db } from "./db";
import { getTopTags } from "./tags/service";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT_BASE = `You are a content analyzer for a personal knowledge management system.

Given a piece of content from social media or the web, analyze it and return a JSON response with:

1. "title" - A clean, concise title (max 80 characters)
2. "summary" - An array of 3-7 bullet points capturing the key ideas
3. "tags" - An array of 3-8 lowercase tags/categories that describe the content
4. "type" - Classify as one of:
   - "learn" - Educational content, knowledge, insights
   - "do" - Actionable content like tutorials, checklists, recipes, workouts
   - "reference" - Stable information to look up later (links, resources, tools)
5. "category" - Classify into ONE of these categories:
   - "tech" - Technology, programming, software, AI, web development, gadgets
   - "business" - Business, finance, entrepreneurship, startups, investing, economics
   - "design" - Design, UI/UX, graphics, creativity, art, aesthetics
   - "productivity" - Productivity, tools, workflows, habits, time management
   - "learning" - Education, tutorials, courses, skills, knowledge
   - "lifestyle" - Health, fitness, food, travel, relationships, personal development
   - "entertainment" - Movies, music, games, sports, fun, humor
   - "news" - Current events, politics, world news, trending topics
   - "other" - Anything that doesn't fit the above categories

Rules:
- Be concise but preserve key insights
- Tags should be single words or short phrases, lowercase
- Summary bullets should be complete sentences
- Focus on extracting the actual value, not meta-commentary
- IMPORTANT: If the extracted content is limited but a "User Note" is provided, use the user's note as the PRIMARY context for generating the summary and tags. The user's note describes what the content is about.
- Category should be the SINGLE most relevant category for the content

Respond ONLY with valid JSON, no markdown or explanation.`;

/**
 * Build system prompt with existing tags for context.
 *
 * @param topTags - Array of top existing tags (empty if no tags exist yet)
 * @returns System prompt with or without existing tags section
 */
function buildSystemPrompt(topTags: string[]): string {
  if (topTags.length === 0) {
    return SYSTEM_PROMPT_BASE;
  }

  return `${SYSTEM_PROMPT_BASE}

EXISTING TAGS IN THE SYSTEM (prefer using these when applicable):
${topTags.join(", ")}

When selecting tags, PRIORITIZE tags from this list if they match the content. Only create new tags if none of the existing tags are suitable.`;
}

export interface SummarizeInput {
  title: string;
  content: string;
  url: string;
  source: string;
  userNote?: string;
}

export async function summarizeContent(
  input: SummarizeInput,
): Promise<SummarizerOutput> {
  const { title, content, url, source, userNote } = input;

  // If content is empty AND no user note, return a basic fallback
  if ((!content || content.trim().length < 50) && !userNote) {
    return {
      title: title || url,
      summary: ["Content could not be extracted from this URL."],
      tags: [source.replace("www.", "").split(".")[0]],
      type: "reference",
      category: "other",
    };
  }

  try {
    // Fetch top tags for LLM context
    const topTags = await getTopTags(db, 100);
    const systemPrompt = buildSystemPrompt(topTags);

    // Build the message, prioritizing user note for blocked content (like Instagram)
    let userMessage = `
URL: ${url}
Source: ${source}
Original Title: ${title}
`;

    // Add user note prominently if provided
    if (userNote && userNote.trim()) {
      userMessage += `
User Note (USE THIS AS PRIMARY CONTEXT):
${userNote.trim()}
`;
    }

    userMessage += `
Content:
${content}
`;

    userMessage = userMessage.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("Empty response from OpenAI");
    }

    const parsed = JSON.parse(responseText) as {
      title?: string;
      summary?: string[];
      tags?: string[];
      type?: string;
      category?: string;
    };

    // Validate and normalize the response
    return {
      title: parsed.title || title || url,
      summary: Array.isArray(parsed.summary)
        ? parsed.summary
        : ["Summary unavailable."],
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.map((t) => t.toLowerCase())
        : [],
      type: isValidType(parsed.type) ? parsed.type : "reference",
      category: isValidCategory(parsed.category) ? parsed.category : "other",
    };
  } catch (error) {
    console.error("Summarization failed:", error);
    // Return fallback on error
    return {
      title: title || url,
      summary: ["Summarization failed. Original content is preserved."],
      tags: ["llm_failed"],
      type: "reference",
      category: "other",
    };
  }
}

function isValidType(type: unknown): type is ItemType {
  return type === "learn" || type === "do" || type === "reference";
}

function isValidCategory(category: unknown): category is ItemCategory {
  const validCategories = [
    "tech",
    "business",
    "design",
    "productivity",
    "learning",
    "lifestyle",
    "entertainment",
    "news",
    "other",
  ];
  return typeof category === "string" && validCategories.includes(category);
}

// Vision API system prompt base
const VISION_SYSTEM_PROMPT_BASE = `You are a content analyzer for a personal knowledge management system.

You will be shown an image (usually from social media like Instagram). Analyze the image and extract all valuable information from it.

If the image contains:
- Infographics: Extract all data points, statistics, and key insights
- Charts/Graphs: Describe trends, numbers, and conclusions
- Text overlays: Read and include all text visible in the image
- Diagrams: Explain the flow or structure shown
- Screenshots: Extract the relevant information displayed

Return a JSON response with:

1. "title" - A clean, concise title describing the image content (max 80 characters)
2. "summary" - An array of 3-7 bullet points capturing ALL key information from the image
3. "tags" - An array of 3-8 lowercase tags/categories
4. "type" - Classify as:
   - "learn" - Educational content, knowledge, insights
   - "do" - Actionable content like tutorials, checklists
   - "reference" - Information to look up later
5. "category" - Classify into ONE of these categories:
   - "tech" - Technology, programming, software, AI, web development
   - "business" - Business, finance, entrepreneurship, startups
   - "design" - Design, UI/UX, graphics, creativity, art
   - "productivity" - Productivity, tools, workflows, habits
   - "learning" - Education, tutorials, courses, skills
   - "lifestyle" - Health, fitness, food, travel, personal development
   - "entertainment" - Movies, music, games, sports, fun
   - "news" - Current events, politics, trending topics
   - "other" - Anything that doesn't fit the above

Rules:
- Extract ALL text and data visible in the image
- Be thorough - don't miss any numbers or facts
- Tags should be lowercase single words or short phrases
- Summary bullets should be complete sentences with specific details
- Category should be the SINGLE most relevant category

Respond ONLY with valid JSON, no markdown or explanation.`;

/**
 * Build vision system prompt with existing tags for context.
 *
 * @param topTags - Array of top existing tags (empty if no tags exist yet)
 * @returns Vision system prompt with or without existing tags section
 */
function buildVisionSystemPrompt(topTags: string[]): string {
  if (topTags.length === 0) {
    return VISION_SYSTEM_PROMPT_BASE;
  }

  return `${VISION_SYSTEM_PROMPT_BASE}

EXISTING TAGS IN THE SYSTEM (prefer using these when applicable):
${topTags.join(", ")}

When selecting tags, PRIORITIZE tags from this list if they match the content. Only create new tags if none of the existing tags are suitable.`;
}

export interface VisionInput {
  title: string;
  imageUrl: string;
  url: string;
  source: string;
  userNote?: string;
  textContent?: string;
}

/**
 * Summarize content using GPT-4 Vision for image analysis
 * Used when extracted text is minimal but image is available
 */
export async function summarizeWithVision(
  input: VisionInput,
): Promise<SummarizerOutput> {
  const { title, imageUrl, url, source, userNote, textContent } = input;

  try {
    // Fetch top tags for LLM context
    const topTags = await getTopTags(db, 100);
    const visionSystemPrompt = buildVisionSystemPrompt(topTags);

    // Build context message
    let contextMessage = `URL: ${url}\nSource: ${source}`;

    if (userNote && userNote.trim()) {
      contextMessage += `\nUser Note: ${userNote.trim()}`;
    }

    if (textContent && textContent.trim()) {
      contextMessage += `\nExtracted Text: ${textContent.trim()}`;
    }

    console.log(
      `Vision API - analyzing image: ${imageUrl.substring(0, 100)}...`,
    );

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use gpt-4o-mini for vision (cost-effective)
      messages: [
        { role: "system", content: visionSystemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: contextMessage },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high", // Use high detail for infographics
              },
            },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("Empty response from Vision API");
    }

    console.log("Vision API - response received");

    const parsed = JSON.parse(responseText) as {
      title?: string;
      summary?: string[];
      tags?: string[];
      type?: string;
      category?: string;
    };

    return {
      title: parsed.title || title || "Image Content",
      summary: Array.isArray(parsed.summary)
        ? parsed.summary
        : ["Image analyzed."],
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.map((t) => t.toLowerCase())
        : [],
      type: isValidType(parsed.type) ? parsed.type : "reference",
      category: isValidCategory(parsed.category) ? parsed.category : "other",
    };
  } catch (error) {
    console.error("Vision summarization failed:", error);

    // Fallback to basic info
    return {
      title: title || "Image Content",
      summary: [
        "Image could not be analyzed. View the original post for details.",
      ],
      tags: [source.replace("www.", "").split(".")[0]],
      type: "reference",
      category: "other",
    };
  }
}
