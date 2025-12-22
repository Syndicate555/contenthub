// Shared platform metadata and helpers for source normalization

export type PlatformSlug =
  | "twitter"
  | "linkedin"
  | "instagram"
  | "facebook"
  | "youtube"
  | "reddit"
  | "tiktok"
  | "newsletter"
  | "other";

export interface PlatformConfig {
  slug: PlatformSlug;
  label: string;
  icon: string; // simple text/emoji for cross-environment use
  domains: string[];
  order: number;
}

export const PLATFORM_CONFIG: PlatformConfig[] = [
  {
    slug: "twitter",
    label: "Twitter",
    icon: "𝕏",
    domains: ["twitter.com", "x.com"],
    order: 1,
  },
  {
    slug: "linkedin",
    label: "LinkedIn",
    icon: "💼",
    domains: ["linkedin.com"],
    order: 2,
  },
  {
    slug: "instagram",
    label: "Instagram",
    icon: "📸",
    domains: ["instagram.com"],
    order: 3,
  },
  {
    slug: "facebook",
    label: "Facebook",
    icon: "📘",
    domains: ["facebook.com", "fb.com", "fb.me", "fb.watch"],
    order: 4,
  },
  {
    slug: "youtube",
    label: "YouTube",
    icon: "▶️",
    domains: ["youtube.com", "youtu.be"],
    order: 5,
  },
  {
    slug: "reddit",
    label: "Reddit",
    icon: "👽",
    domains: ["reddit.com"],
    order: 6,
  },
  {
    slug: "tiktok",
    label: "TikTok",
    icon: "🎵",
    domains: ["tiktok.com", "vm.tiktok.com"],
    order: 7,
  },
  {
    slug: "newsletter",
    label: "Newsletter",
    icon: "✉️",
    domains: [
      "email",
      "resend",
      "sendgrid",
      "mailgun",
      "newsletter",
      "substack.com",
    ],
    order: 8,
  },
  {
    slug: "other",
    label: "Other",
    icon: "🌐",
    domains: [],
    order: 99,
  },
];

export function normalizePlatformSlug(
  slug?: string | null,
): PlatformSlug | null {
  if (!slug) return null;
  const match = PLATFORM_CONFIG.find(
    (platform) => platform.slug === slug.toLowerCase(),
  );
  return match ? match.slug : null;
}

export function getPlatformDomains(slug: PlatformSlug): string[] {
  return (
    PLATFORM_CONFIG.find((platform) => platform.slug === slug)?.domains || []
  );
}

export function getPlatformLabel(slug: PlatformSlug): string {
  return (
    PLATFORM_CONFIG.find((platform) => platform.slug === slug)?.label || slug
  );
}

export function getPlatformSlugFromSource(
  source?: string | null,
): PlatformSlug {
  const normalized = source?.toLowerCase() || "";

  for (const platform of PLATFORM_CONFIG) {
    if (
      platform.domains.some((domain) =>
        normalized.includes(domain.replace("www.", "")),
      )
    ) {
      return platform.slug;
    }
  }

  return "other";
}
