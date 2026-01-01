import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Always use production domain for robots.txt
  const baseUrl = "https://tavlo.ca";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/sign-in", "/privacy"],
        disallow: [
          "/api/",
          "/today",
          "/items",
          "/add",
          "/profile",
          "/settings",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
