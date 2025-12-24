"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { CSSReveal } from "@/components/motion";

const features = [
  "Free access during beta",
  "Early access to new features",
  "Direct line to the founders",
  "Locked-in early adopter pricing",
  "Beta member badge",
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-20 md:py-28 px-4 relative">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <CSSReveal>
            <span className="inline-flex items-center gap-2 badge-brand mb-4">
              Beta Access
            </span>
          </CSSReveal>
          <CSSReveal delay={0.1}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-4">
              Join the beta.{" "}
              <span className="bg-gradient-to-r from-brand-1 to-brand-2 bg-clip-text text-transparent">
                100% free.
              </span>
            </h2>
          </CSSReveal>
          <CSSReveal delay={0.2}>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              We&apos;re building Tavlo with early users. Join now and help
              shape the product while getting free access.
            </p>
          </CSSReveal>
        </div>

        <CSSReveal delay={0.3}>
          <div className="relative max-w-md mx-auto">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-brand-1/30 to-brand-2/30 rounded-[2rem] blur-xl opacity-50" />

            <div className="relative bg-surface-solid rounded-[1.5rem] border border-brand-1/20 shadow-xl overflow-hidden">
              <div className="p-8 md:p-10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-text-primary">
                    Beta Program
                  </h3>
                  <span className="px-3 py-1 bg-brand-1-light text-brand-1 text-xs font-bold uppercase tracking-wide rounded-full">
                    Early Access
                  </span>
                </div>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-text-primary">
                    Free
                  </span>
                  <span className="text-text-muted">
                    / forever for beta users
                  </span>
                </div>

                <p className="text-sm text-text-secondary mb-8">
                  Everything you need to organize your saves. No credit card. No
                  catch.
                </p>

                <div className="space-y-4 mb-8">
                  {features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-2-light flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-brand-2" />
                      </div>
                      <span className="text-sm text-text-body">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/sign-in"
                  className="block w-full py-4 bg-gradient-to-r from-brand-1 to-brand-2 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-1/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group"
                  aria-label="Join the beta program - Sign up now"
                >
                  Join the beta
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <p className="text-xs text-center text-text-muted mt-4">
                  Limited spots available for this batch.
                </p>
              </div>
            </div>
          </div>
        </CSSReveal>
      </div>
    </section>
  );
};

export default Pricing;
