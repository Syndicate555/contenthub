"use client";

import React, { useRef } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { Rocket, BookOpen, Palette, FlaskConical, Cpu } from "lucide-react";
import { socialProofItems } from "@/data/landing";

const SocialProof = () => {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.25 });

  const listVariants = prefersReducedMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1] as const,
            staggerChildren: 0.08,
            delayChildren: 0.1,
          },
        },
      };

  const itemVariants = prefersReducedMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 10, scale: 0.98 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] as const },
        },
      };

  const personaMeta: Record<
    string,
    { icon: React.ReactNode; gradient: string; glow: string }
  > = {
    Founders: {
      icon: <Rocket className="w-4 h-4" />,
      gradient: "from-brand-1 to-brand-2",
      glow: "shadow-[0_10px_35px_-10px_rgba(91,91,255,0.45)]",
    },
    Students: {
      icon: <BookOpen className="w-4 h-4" />,
      gradient: "from-emerald-400 to-teal-300",
      glow: "shadow-[0_10px_35px_-10px_rgba(52,211,153,0.45)]",
    },
    Creators: {
      icon: <Palette className="w-4 h-4" />,
      gradient: "from-pink-400 to-orange-300",
      glow: "shadow-[0_10px_35px_-10px_rgba(249,115,22,0.45)]",
    },
    Researchers: {
      icon: <FlaskConical className="w-4 h-4" />,
      gradient: "from-indigo-400 to-sky-300",
      glow: "shadow-[0_10px_35px_-10px_rgba(99,102,241,0.45)]",
    },
    Engineers: {
      icon: <Cpu className="w-4 h-4" />,
      gradient: "from-amber-400 to-yellow-300",
      glow: "shadow-[0_10px_35px_-10px_rgba(251,191,36,0.45)]",
    },
  };

  return (
    <section
      ref={sectionRef}
      className="py-12 px-4 relative overflow-hidden"
      aria-label="Target audience"
    >
      {/* playful ambient blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-10 top-0 h-48 w-48 rounded-full bg-brand-1/10 blur-3xl" />
        <div className="absolute right-0 top-6 h-40 w-40 rounded-full bg-brand-2/20 blur-3xl" />
        <div className="absolute left-1/2 bottom-[-60px] h-52 w-52 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto relative">
        <div className="flex flex-col items-center gap-6">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={
              prefersReducedMotion
                ? undefined
                : inView
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 16 }
            }
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] as const }}
            className="inline-flex items-center gap-2 rounded-full border border-border-light/60 bg-white/70 px-3 py-1 text-xs font-semibold text-text-secondary shadow-sm backdrop-blur"
          >
            <span className="h-2 w-2 rounded-full bg-brand-1 animate-ping" />
            Built for the people who make the internet interesting
          </motion.div>

          <motion.div
            role="list"
            variants={listVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {socialProofItems.map((item, index) => (
              <motion.span
                key={item}
                variants={itemVariants}
                whileHover={
                  prefersReducedMotion ? undefined : { scale: 1.05, rotate: 1 }
                }
                className="group relative px-4 py-2 rounded-full text-sm font-semibold text-gray-900 border border-transparent shadow-sm transition-all cursor-default"
                role="listitem"
              >
                <span
                  className={`absolute inset-0 rounded-full opacity-90 bg-gradient-to-r ${
                    personaMeta[item]?.gradient || "from-gray-200 to-gray-100"
                  } ${personaMeta[item]?.glow || ""}`}
                  aria-hidden
                />
                <span className="relative flex items-center gap-2 px-0.5 text-white drop-shadow-sm">
                  {personaMeta[item]?.icon}
                  <span>{item}</span>
                </span>
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
