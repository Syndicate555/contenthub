import { type WithContext, type Organization } from "schema-dts";

interface StructuredDataProps {
  data: WithContext<Organization> | Record<string, unknown>;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Organization Schema for the website
export const organizationSchema: WithContext<Organization> = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Tavlo",
  url: "https://tavlo.ca",
  logo: "https://tavlo.ca/tavo_logo.png",
  description:
    "Your personal second brain for social media content. Save, organize, and revisit valuable content from Twitter, LinkedIn, Instagram, and more.",
  sameAs: [
    // Add your social media profiles here when available
    // "https://twitter.com/tavlo",
    // "https://linkedin.com/company/tavlo",
  ],
};

// Website Schema
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Tavlo",
  url: "https://tavlo.ca",
  description:
    "Your personal second brain for social media content. Save, organize, and revisit valuable content from Twitter, LinkedIn, Instagram, and more.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://tavlo.ca/items?search={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
} as const;
