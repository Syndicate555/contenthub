import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tavlo.ca";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/sign-in"],
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
