"use client";

import React, { useEffect } from "react";
import { trackPageView } from "@/lib/analytics";
import {
  Header,
  Hero,
  SocialProof,
  Features,
  VideoDemo,
  WhyTavlo,
  Testimonials,
  Integrations,
  Pricing,
  FAQ,
  FinalCTA,
  Footer,
} from "@/components/landing";

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
