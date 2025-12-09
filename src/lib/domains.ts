// Domain Mapping - Maps content categories to knowledge domains
// Used to auto-classify items and award domain-specific XP

import { db } from "@/lib/db";

// Map content categories (from AI summarization) to domain names
// Categories: tech, business, design, productivity, learning, lifestyle, entertainment, news, other
// Domains: finance, career, health, philosophy, relationships, productivity, creativity, technology
export const CATEGORY_TO_DOMAIN: Record<string, string> = {
  // Direct mappings
  tech: "technology",
  productivity: "productivity",
  design: "creativity",

  // Business can be finance or career - default to finance
  business: "finance",

  // Lifestyle encompasses health, relationships
  lifestyle: "health",

  // Learning is knowledge acquisition - map to philosophy (wisdom/mindset)
  learning: "philosophy",

  // Entertainment - creative content
  entertainment: "creativity",

  // News - general knowledge, map to philosophy
  news: "philosophy",

  // Other - no specific domain
  other: "",
};

// Secondary mappings based on tags for more accurate domain detection
// These keywords in tags can override the category-based domain
export const TAG_DOMAIN_KEYWORDS: Record<string, string[]> = {
  finance: [
    "investing",
    "investment",
    "stocks",
    "crypto",
    "bitcoin",
    "money",
    "budgeting",
    "wealth",
    "financial",
    "economy",
    "economics",
    "trading",
    "portfolio",
    "assets",
    "savings",
    "retirement",
    "401k",
    "ira",
  ],
  career: [
    "career",
    "job",
    "interview",
    "resume",
    "linkedin",
    "networking",
    "salary",
    "promotion",
    "workplace",
    "professional",
    "hiring",
    "management",
    "leadership",
    "mentor",
    "skill",
  ],
  health: [
    "health",
    "fitness",
    "workout",
    "exercise",
    "gym",
    "nutrition",
    "diet",
    "mental health",
    "meditation",
    "sleep",
    "wellness",
    "yoga",
    "running",
    "weight",
    "muscle",
  ],
  philosophy: [
    "philosophy",
    "wisdom",
    "mindset",
    "stoic",
    "thinking",
    "ethics",
    "life",
    "meaning",
    "happiness",
    "psychology",
    "cognitive",
    "bias",
    "decision",
    "thinking",
  ],
  relationships: [
    "relationship",
    "dating",
    "marriage",
    "family",
    "social",
    "communication",
    "friendship",
    "love",
    "parenting",
    "children",
  ],
  productivity: [
    "productivity",
    "habit",
    "routine",
    "time management",
    "focus",
    "efficiency",
    "workflow",
    "automation",
    "tools",
    "notion",
    "obsidian",
    "todoist",
    "calendar",
  ],
  creativity: [
    "design",
    "art",
    "creative",
    "writing",
    "music",
    "photography",
    "video",
    "animation",
    "illustration",
    "ux",
    "ui",
    "figma",
    "adobe",
    "photoshop",
  ],
  technology: [
    "programming",
    "coding",
    "software",
    "ai",
    "machine learning",
    "web",
    "app",
    "developer",
    "javascript",
    "python",
    "react",
    "api",
    "database",
    "cloud",
    "startup",
    "tech",
  ],
};

// Cache for domain name -> id mapping
let domainCache: Map<string, string> | null = null;

/**
 * Get domain ID from domain name (with caching)
 */
async function getDomainId(domainName: string): Promise<string | null> {
  if (!domainName) return null;

  // Initialize cache if needed
  if (!domainCache) {
    const domains = await db.domain.findMany({
      select: { id: true, name: true },
    });
    domainCache = new Map(domains.map((d) => [d.name, d.id]));
  }

  return domainCache.get(domainName) || null;
}

/**
 * Determine the best domain for content based on category and tags
 * Uses a scoring system to find the best match
 */
export async function getDomainForContent(
  category: string | null,
  tags: string[],
): Promise<string | null> {
  // Normalize tags for matching
  const normalizedTags = tags.map((t) => t.toLowerCase().trim());

  // Score each domain based on tag matches
  const domainScores: Record<string, number> = {};

  // Priority order for checking domains (technology first since it has specific keywords)
  const domainOrder = [
    "technology",
    "finance",
    "productivity",
    "creativity",
    "health",
    "career",
    "philosophy",
    "relationships",
  ];

  for (const domainName of domainOrder) {
    const keywords = TAG_DOMAIN_KEYWORDS[domainName];
    if (!keywords) continue;

    let score = 0;
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();
      for (const tag of normalizedTags) {
        // Exact match gets highest score
        if (tag === lowerKeyword) {
          score += 3;
        }
        // Tag starts with keyword (e.g., "programming" matches tag "programming language")
        else if (
          tag.startsWith(lowerKeyword + " ") ||
          tag.endsWith(" " + lowerKeyword)
        ) {
          score += 2;
        }
        // Tag contains keyword as a word (word boundary matching)
        else if (
          tag.includes(lowerKeyword) &&
          (tag === lowerKeyword ||
            tag.startsWith(lowerKeyword + " ") ||
            tag.endsWith(" " + lowerKeyword) ||
            tag.includes(" " + lowerKeyword + " "))
        ) {
          score += 1;
        }
      }
    }

    if (score > 0) {
      domainScores[domainName] = score;
    }
  }

  // Find the domain with the highest score
  let bestDomain: string | null = null;
  let bestScore = 0;

  for (const [domainName, score] of Object.entries(domainScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestDomain = domainName;
    }
  }

  // If we found a match from tags, return it
  if (bestDomain) {
    const domainId = await getDomainId(bestDomain);
    if (domainId) return domainId;
  }

  // Fall back to category-based mapping
  if (category) {
    const domainName = CATEGORY_TO_DOMAIN[category.toLowerCase()];
    if (domainName) {
      return getDomainId(domainName);
    }
  }

  return null;
}

/**
 * Clear domain cache (call if domains are updated)
 */
export function clearDomainCache() {
  domainCache = null;
}
