"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link, Sparkles, BrainCircuit, Library } from "lucide-react";

// Placeholder data - replace with your actual screenshots later
const STEPS = [
  {
    id: "step-1",
    title: "Paste any link",
    description:
      "Found something interesting? Just copy the URL from Instagram, TikTok, LinkedIn, or any web page and paste it into Tavlo. We handle the rest.",
    icon: Link,
    color: "from-blue-500 to-cyan-400",
    image: "/step-1-placeholder.png", // Replace with your screenshot
  },
  {
    id: "step-2",
    title: "AI Analysis & Tagging",
    description:
      "Our AI instantly analyzes the content. It generates a summary, assigns relevant tags, categorizes the item, and even extracts key insights from videos.",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
    image: "/step-2-placeholder.png", // Replace with your screenshot
  },
  {
    id: "step-3",
    title: "Your Second Brain",
    description:
      "The content is saved to your organized library. Searchable, filterable, and ready for you to revisit or repurpose whenever you need it.",
    icon: Library,
    color: "from-amber-500 to-orange-500",
    image: "/step-3-placeholder.png", // Replace with your screenshot
  },
];

export const HowItWorks = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  // Handle scroll detection manually for better control over the "active" state
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const stepElements = containerRef.current.querySelectorAll(".step-item");
      const viewportCenter = window.innerHeight / 2;

      stepElements.forEach((step, index) => {
        const rect = step.getBoundingClientRect();
        // If the step is roughly in the middle of the screen
        if (
          rect.top <= viewportCenter + 100 &&
          rect.bottom >= viewportCenter - 100
        ) {
          setActiveStep(index);
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      className="relative w-full bg-white py-12 md:py-24"
      ref={containerRef}
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-1/10 text-brand-1 text-sm font-medium mb-6"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>How it works</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary mb-6"
          >
            From chaos to clarity in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-1 to-brand-2">
              three simple steps
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-text-secondary md:text-xl leading-relaxed"
          >
            Stop losing valuable content. Tavlo transforms your random bookmarks
            into a structured knowledge base without the manual effort.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 relative items-start">
          {/* LEFT COLUMN - STICKY VISUAL */}
          <div className="hidden lg:block sticky top-0 h-screen flex items-center justify-center">
            <div className="w-full max-w-lg">
              <div className="relative aspect-square bg-gray-100 rounded-3xl overflow-hidden shadow-2xl border border-gray-200/50">
                {STEPS.map((step, index) => (
                  <motion.div
                    key={step.id}
                    className="absolute inset-0 w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: activeStep === index ? 1 : 0,
                      scale: activeStep === index ? 1 : 1.05,
                      filter: activeStep === index ? "blur(0px)" : "blur(10px)",
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    {/* Placeholder for the screenshot */}
                    <div
                      className={cn(
                        "w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br",
                        step.color
                      )}
                    >
                      <step.icon className="w-24 h-24 text-white mb-4 drop-shadow-md" />
                      <div className="text-white text-2xl font-bold text-center drop-shadow-md">
                        {step.title} Screenshot
                      </div>
                      {/*
                        TODO: Replace the above div with your actual Image component:
                        <Image src={step.image} alt={step.title} fill className="object-cover" />
                      */}
                    </div>
                  </motion.div>
                ))}

                {/* Device Frame / UI Chrome (Optional decoration) */}
                <div className="absolute inset-0 border-[6px] border-white/20 rounded-3xl pointer-events-none" />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - SCROLLING STEPS */}
          <div className="flex flex-col">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.id}
                className={cn(
                  "step-item flex flex-col justify-center py-8 lg:min-h-[60vh] transition-all duration-500",
                  activeStep === index ? "opacity-100" : "lg:opacity-30",
                  index === 0 ? "lg:pt-[30vh]" : "", // Push first item down to align with centered sticky
                  index === STEPS.length - 1 ? "lg:pb-[30vh]" : "" // Push last item up to allow full scroll
                )}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ margin: "-50% 0px -50% 0px" }} // Trigger when center crosses center
                onViewportEnter={() => setActiveStep(index)} // Use InView callback for robustness
              >
                {/* Mobile-only visual */}
                <div className="lg:hidden w-full aspect-video rounded-xl bg-gray-100 overflow-hidden mb-6 relative shadow-md">
                  <div
                    className={cn(
                      "w-full h-full flex flex-col items-center justify-center bg-gradient-to-br",
                      step.color
                    )}
                  >
                    <step.icon className="w-12 h-12 text-white" />
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg shrink-0",
                      step.color
                    )}
                  >
                    <span className="text-white font-bold text-xl">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {step.title}
                  </h3>
                </div>

                <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
