import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { socialProofItems } from '@/data/landing';

const SocialProof = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-8 px-4 relative" aria-label="Target audience">
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-brand-1/[0.015] to-transparent" />
      
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <p className="text-sm text-text-muted font-medium">
            Built for
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2" role="list">
            {socialProofItems.map((item, index) => (
              <motion.span
                key={item}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.05,
                  ease: [0.4, 0, 0.2, 1]
                }}
                className="px-3 py-1.5 bg-surface-solid rounded-full text-sm font-medium text-text-body border border-border-light hover:border-brand-1/30 hover:shadow-sm transition-all cursor-default"
                role="listitem"
              >
                {item}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
