"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BrainCircuit } from "lucide-react";

type Step = {
  id: string;
  image: string;
};

const STEPS: Step[] = [
  {
    id: "step-1",
    image: "/how-it-works/step-1.png",
  },
  {
    id: "step-2",
    image: "/how-it-works/step-2.png",
  },
  {
    id: "step-3",
    image: "/how-it-works/step-3.png",
  },
];

export const ScrollingFeatures = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      className="relative w-full bg-white py-12 md:py-24"
      ref={containerRef}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 relative items-start">
          {/* LEFT COLUMN - STICKY TEXT CONTENT */}
          <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-12rem)] flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-1/10 text-brand-1 text-sm font-semibold mb-6 w-fit"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>HOW IT WORKS</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary mb-6 leading-tight"
            >
              Build your second brain in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-1 to-brand-2">
                three simple steps
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-text-secondary leading-relaxed max-w-xl"
            >
              Stop losing valuable content across dozens of tabs and bookmarks.
              Tavlo transforms your scattered inspiration into an organized,
              searchable knowledge base—without the manual effort.
            </motion.p>
          </div>

          {/* RIGHT COLUMN - SCROLLING IMAGES */}
          <div className="flex flex-col gap-12 md:gap-24">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className="relative w-full min-h-[400px] md:min-h-[600px]"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false, amount: 0.5 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={cn(
                    "relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200/50",
                    "aspect-[3/4] md:aspect-[4/5]",
                  )}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="text-6xl md:text-8xl font-bold text-gray-300 mb-4">
                        {index + 1}
                      </div>
                      <div className="text-gray-400 text-sm md:text-base">
                        Screenshot placeholder
                        <br />
                        {step.image}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScrollingFeatures;
