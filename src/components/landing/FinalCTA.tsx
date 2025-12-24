"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CSSReveal, BackgroundOrbs } from "@/components/motion";

const FinalCTA = () => {
  return (
    <section id="cta" className="py-20 md:py-28 px-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10 mesh-gradient" />
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-1/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-2/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-2xl mx-auto text-center relative">
        {/* Badge */}
        <CSSReveal>
          <div className="inline-flex items-center gap-2 badge-brand mb-8">
            <span className="w-2 h-2 rounded-full bg-brand-1 animate-pulse-glow" />
            Get started for free
          </div>
        </CSSReveal>

        <CSSReveal delay={0.1}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-4">
            Stop losing{" "}
            <span className="bg-gradient-to-r from-brand-1 via-brand-3 to-brand-2 bg-clip-text text-transparent">
              great content
            </span>
          </h2>
        </CSSReveal>

        <CSSReveal delay={0.2}>
          <p className="text-lg text-text-secondary mb-10 leading-relaxed">
            Start transforming your saved posts into reusable knowledge today.
            No credit card required.
          </p>
        </CSSReveal>

        {/* CTA Button */}
        <CSSReveal delay={0.3}>
          <div className="flex justify-center mb-6">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-1 to-brand-2 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-brand-1/30 hover:-translate-y-0.5 active:translate-y-0 transition-all text-lg"
              aria-label="Try Tavlo for free - Sign up now"
            >
              Try it today for free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </CSSReveal>

        {/* Trust line */}
        <CSSReveal delay={0.4}>
          <p className="text-sm text-text-muted">Secure. Private. Yours.</p>
        </CSSReveal>
      </div>
    </section>
  );
};

export default FinalCTA;
