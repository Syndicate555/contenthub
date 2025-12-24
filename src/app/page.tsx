import React from "react";
import dynamic from "next/dynamic";
import {
  Header,
  Hero,
  TavloLoop,
  SocialProof,
  Features,
  WhyTavlo,
  Testimonials,
} from "@/components/landing";
import { ComponentSkeleton } from "@/components/landing/ComponentSkeleton";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

// Lazy load below-fold components for better initial bundle size
const VideoDemo = dynamic(() => import("@/components/landing/VideoDemo"), {
  loading: () => <ComponentSkeleton variant="video" minHeight="600px" />,
});

const Integrations = dynamic(
  () => import("@/components/landing/Integrations"),
  {
    loading: () => <ComponentSkeleton variant="section" minHeight="300px" />,
  },
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
        <SocialProof />
        <Features />
        <VideoDemo />
        {/* <WhyTavlo /> */}
        {/* <Testimonials /> */}
        <Integrations />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
