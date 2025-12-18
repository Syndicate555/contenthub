/**
 * Platform normalization utilities
 * Consolidates domain variations into canonical platform names
 */

/**
 * Known platform patterns and their canonical names
 */
const PLATFORM_PATTERNS = {
  // Social media
  twitter: ["twitter.com", "x.com", "t.co"],
  reddit: ["reddit.com"],
  instagram: ["instagram.com", "instagr.am"],
  tiktok: ["tiktok.com"],
  youtube: ["youtube.com", "youtu.be"],
  linkedin: ["linkedin.com", "lnkd.in"],
  facebook: ["facebook.com", "fb.com", "fb.me"],

  // Tech platforms
  github: ["github.com", "gist.github.com"],
  medium: ["medium.com"],
  substack: ["substack.com"],

  // News/Content
  "nytimes.com": ["nytimes.com"],
  "techcrunch.com": ["techcrunch.com"],

  // Developer tools
  "anthropic.skilljar.com": ["anthropic.skilljar.com"],
  "productmarketfit.tech": [
    "productmarketfit.tech",
    "www.productmarketfit.tech",
  ],
  "deeplearning.ai": ["deeplearning.ai", "learn.deeplearning.ai"],
} as const;

/**
 * Normalize a domain by removing common prefixes and known variations
 */
export function normalizeDomain(domain: string): string {
  if (!domain) return "unknown";

  // Convert to lowercase
  let normalized = domain.toLowerCase().trim();

  // Remove protocol if present
  normalized = normalized.replace(/^https?:\/\//, "");

  // Remove www. prefix
  normalized = normalized.replace(/^www\./, "");

  // Remove mobile/subdomain prefixes for known platforms
  normalized = normalized
    .replace(/^m\./, "") // mobile subdomain
    .replace(/^mobile\./, "") // mobile subdomain
    .replace(/^app\./, "") // app subdomain
    .replace(/^vt\./, "") // TikTok video subdomain
    .replace(/^vm\./, "") // TikTok mobile subdomain
    .replace(/^v\./, "") // Short video subdomain
    .replace(/^old\./, "") // Old Reddit
    .replace(/^new\./, "") // New Reddit
    .replace(/^i\./, "") // Image subdomain (Instagram, etc.)
    .replace(/^web\./, ""); // Web subdomain

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, "");

  // Remove path - keep only domain
  normalized = normalized.split("/")[0];

  // Remove port if present
  normalized = normalized.split(":")[0];

  // Check against known platform patterns
  for (const [canonical, patterns] of Object.entries(PLATFORM_PATTERNS)) {
    for (const pattern of patterns) {
      if (normalized === pattern || normalized.endsWith(`.${pattern}`)) {
        return canonical;
      }
    }
  }

  return normalized;
}

/**
 * Get display name for a platform (with proper capitalization)
 */
export function getPlatformDisplayName(canonicalName: string): string {
  const displayNames: Record<string, string> = {
    twitter: "X (Twitter)",
    reddit: "Reddit",
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
    linkedin: "LinkedIn",
    facebook: "Facebook",
    github: "GitHub",
    medium: "Medium",
    substack: "Substack",
    "anthropic.skilljar.com": "Anthropic Skilljar",
    "productmarketfit.tech": "Product Market Fit",
    "deeplearning.ai": "DeepLearning.AI",
    "nytimes.com": "The New York Times",
    "techcrunch.com": "TechCrunch",
  };

  return displayNames[canonicalName] || canonicalName;
}

/**
 * Group platform counts by normalized domain
 */
export function consolidatePlatforms(
  platforms: Array<{ platform: string; count: number }>,
): Array<{
  platform: string;
  displayName: string;
  count: number;
  variations: string[];
}> {
  // Group by normalized domain
  const grouped = new Map<string, { count: number; variations: Set<string> }>();

  for (const p of platforms) {
    const normalized = normalizeDomain(p.platform);

    if (!grouped.has(normalized)) {
      grouped.set(normalized, { count: 0, variations: new Set() });
    }

    const entry = grouped.get(normalized)!;
    entry.count += p.count;
    entry.variations.add(p.platform);
  }

  // Convert to array and sort by count
  return Array.from(grouped.entries())
    .map(([canonical, data]) => ({
      platform: canonical,
      displayName: getPlatformDisplayName(canonical),
      count: data.count,
      variations: Array.from(data.variations),
    }))
    .sort((a, b) => b.count - a.count);
}
