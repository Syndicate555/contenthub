"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { trackPageView } from "@/lib/analytics";
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

// Lazy load below-fold components for better initial bundle size
const VideoDemo = dynamic(() => import("@/components/landing/VideoDemo"), {
  loading: () => <ComponentSkeleton variant="video" minHeight="600px" />,
  ssr: false,
});

const Integrations = dynamic(
  () => import("@/components/landing/Integrations"),
  {
    loading: () => <ComponentSkeleton variant="section" minHeight="300px" />,
    ssr: false,
  },
);

const Pricing = dynamic(() => import("@/components/landing/Pricing"), {
  loading: () => <ComponentSkeleton variant="cards" minHeight="500px" />,
  ssr: false,
});

const FAQ = dynamic(() => import("@/components/landing/FAQ"), {
  loading: () => <ComponentSkeleton variant="section" minHeight="400px" />,
  ssr: false,
});

const FinalCTA = dynamic(() => import("@/components/landing/FinalCTA"), {
  loading: () => <ComponentSkeleton variant="section" minHeight="350px" />,
  ssr: false,
});

const Footer = dynamic(() => import("@/components/landing/Footer"), {
  loading: () => <ComponentSkeleton variant="footer" minHeight="400px" />,
  ssr: false,
});

export default function HomePage() {
  useEffect(() => {
    trackPageView("landing");
  }, []);

  return (
    <div className="min-h-screen bg-bg-page text-text-body font-sans selection:bg-brand-1/20 selection:text-text-primary">
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
