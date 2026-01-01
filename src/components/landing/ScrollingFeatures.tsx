"use client";
import { useRef } from "react";
import { motion } from "framer-motion";
import { BrainCircuit } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Step = {
  id: string;
  image: string;
  alt: string;
  aspectClass?: string;
  minHeightClass?: string;
  fit?: "cover" | "contain";
  frameClass?: string;
  unoptimized?: boolean;
  wrapperClass?: string;
};

const STEPS: Step[] = [
  {
    id: "step-1",
    image:
      "https://res.cloudinary.com/dggvt0gzu/image/upload/v1766752242/plus_d9xheg.gif",
    alt: "Animated preview of saving content into Tavlo.",
    aspectClass: "aspect-[16/9]",
    minHeightClass: "min-h-[240px] md:min-h-[320px]",
    fit: "contain",
    frameClass: "p-4 md:p-6 bg-surface-solid",
    unoptimized: true,
    wrapperClass: "lg:mt-20 xl:mt-48",
  },
  {
    id: "step-2",
    image:
      "https://res.cloudinary.com/dggvt0gzu/image/upload/v1766752297/step_2_bitli9.gif",
    alt: "Saved content organized in Tavlo with filters and tags.",
    aspectClass: "aspect-[3/4] md:aspect-[4/5]",
    minHeightClass: "min-h-[400px] md:min-h-[600px]",
    fit: "cover",
  },
  {
    id: "step-3",
    image:
      "https://res.cloudinary.com/dggvt0gzu/image/upload/v1766748131/Screenshot_2025-12-26_at_6.21.43_AM_bpul29.png",
    alt: "Tavlo summary view showing curated saves and highlights.",
    aspectClass: "aspect-[3/4] md:aspect-[4/5]",
    minHeightClass: "min-h-[400px] md:min-h-[600px]",
    fit: "contain",
    frameClass: "p-4 md:p-6 bg-surface-solid",
  },
];

export const ScrollingFeatures = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id="how-it-works"
      className="relative w-full bg-bg-page py-12 md:py-24"
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
              Once logged in, click the `Add` button on the navigation menu.
              Paste the link to your desired content and click `Save & process`.
              Thats it! After the post is done processing, it will be available
              for viewing in your inbox and library
            </motion.p>
          </div>

          {/* RIGHT COLUMN - SCROLLING IMAGES */}
          <div className="flex flex-col gap-12 md:gap-24">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "relative w-full",
                  step.minHeightClass ?? "min-h-[400px] md:min-h-[600px]",
                  step.wrapperClass
                )}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false, amount: 0.5 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={cn(
                    "relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-border-light bg-surface-solid",
                    step.aspectClass ?? "aspect-[3/4] md:aspect-[4/5]",
                    step.frameClass
                  )}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={step.image}
                      alt={step.alt || `Tavlo workflow step ${index + 1}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 520px"
                      className={
                        step.fit === "contain"
                          ? "object-contain"
                          : "object-cover"
                      }
                      quality={95}
                      unoptimized={step.unoptimized}
                    />
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
