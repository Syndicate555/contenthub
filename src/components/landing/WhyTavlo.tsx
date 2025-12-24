"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { whyTavloContent } from "@/data/landing";

const WhyTavlo = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      className="py-12 px-4 relative"
      aria-labelledby="why-tavlo-heading"
    >
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Decorative quote mark */}
          <div
            className="absolute -top-4 -left-2 text-7xl font-serif text-brand-1/10 select-none pointer-events-none"
            aria-hidden="true"
          >
            "
          </div>

          <div className="relative bg-gradient-to-br from-surface-solid to-surface/50 rounded-2xl p-6 md:p-8 border border-border-light shadow-lg shadow-black/5">
            {/* Gradient accent line */}
            <div
              className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-brand-1 via-brand-3 to-brand-2 rounded-full"
              aria-hidden="true"
            />

            <h2
              id="why-tavlo-heading"
              className="text-lg md:text-xl font-bold text-text-primary mb-5 leading-snug"
            >
              {whyTavloContent.headline}
            </h2>

            <ul className="space-y-2.5 mb-5" role="list">
              {whyTavloContent.points.map((point, index) => (
                <motion.li
                  key={index}
                  initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="text-text-secondary flex items-start gap-3"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-brand-2 mt-2 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: point.replace(
                        /\*(.*?)\*/g,
                        '<em class="text-brand-1 not-italic font-medium">$1</em>',
                      ),
                    }}
                  />
                </motion.li>
              ))}
            </ul>

            <p className="text-base font-medium text-text-primary border-t border-border-light pt-5">
              {whyTavloContent.cta}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyTavlo;
