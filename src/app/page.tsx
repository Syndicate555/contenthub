import React from "react";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import {
  Header,
  Hero,
  TavloLoop,
  SocialProof,
  Features,
  Testimonials,
  ScrollingFeatures,
  UnifiedLibrary,
} from "@/components/landing";
import WhyTavloSection from "@/components/landing/WhyTavloSection";
import { ComponentSkeleton } from "@/components/landing/ComponentSkeleton";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

const title = "Tavlo - Your Personal Second Brain for Social Media Content";
const description =
  "Transform how you capture, organize, and repurpose content from across the web. Tavlo helps creators and professionals build their second brain for social media, newsletters, and more.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "content management",
    "second brain",
    "social media",
    "content curation",
    "knowledge management",
    "creator tools",
    "content organization",
  ],
  authors: [{ name: "Tavlo" }],
  creator: "Tavlo",
  publisher: "Tavlo",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tavlo.ca",
    siteName: "Tavlo",
    title,
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tavlo - Your Personal Second Brain",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
    creator: "@tavloapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

// Lazy load below-fold components for better initial bundle size
const VideoDemo = dynamic(() => import("@/components/landing/VideoDemo"), {
  loading: () => <ComponentSkeleton variant="video" minHeight="600px" />,
});

const Integrations = dynamic(
  () => import("@/components/landing/Integrations"),
  {
    loading: () => <ComponentSkeleton variant="section" minHeight="300px" />,
  }
);

const Pricing = dynamic(() => import("@/components/landing/Pricing"), {
  loading: () => <ComponentSkeleton variant="cards" minHeight="500px" />,
});

const FAQ = dynamic(() => import("@/components/landing/FAQ"), {
  loading: () => <ComponentSkeleton variant="section" minHeight="400px" />,
});

const FinalCTA = dynamic(() => import("@/components/landing/FinalCTA"), {
  loading: () => <ComponentSkeleton variant="section" minHeight="350px" />,
});

const Footer = dynamic(() => import("@/components/landing/Footer"), {
  loading: () => <ComponentSkeleton variant="footer" minHeight="400px" />,
});

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-page text-text-body font-sans selection:bg-brand-1/20 selection:text-text-primary">
      {/* Analytics tracking - client component */}
      <AnalyticsTracker page="landing" />

      {/* Noise overlay for premium texture */}
      <div className="noise-overlay" />

      <Header />
      <main>
        <br></br>
        <br></br>
        <Hero />
        <br></br>
        <br></br>
        <br></br>
        <br></br>
        <br></br>
        <TavloLoop />
        <br></br>
        <br></br>
        <br></br>
        <UnifiedLibrary />
        <Features />
        <VideoDemo />
        <ScrollingFeatures />
        <WhyTavloSection />
        <Integrations />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
