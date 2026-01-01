import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // Always use production domain for sitemap
  // This ensures Google Search Console gets the correct URLs
  const baseUrl = "https://tavlo.ca";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
