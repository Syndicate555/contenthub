"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function AnimatedHero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["personal", "customized", "unique", "special"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  const scrollToFeatures = () => {
    const element = document.getElementById("demo");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="w-full relative z-10">
      {/* Video Background - Right Side (responsive, single video) */}
      <div className="hidden lg:block absolute inset-0 overflow-hidden">
        <div className="container mx-auto px-4 h-full">
          <div className="grid grid-cols-2 gap-8 lg:gap-12 h-full">
            {/* Empty left space */}
            <div />
            {/* Video on right side */}
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                  poster="https://res.cloudinary.com/dggvt0gzu/video/upload/v1766757137/Screen_Recording_2025-12-26_at_8.46.33_AM_i5xmum.jpg"
                  aria-label="Product demonstration"
                >
                  <source
                    src="https://res.cloudinary.com/dggvt0gzu/video/upload/v1766757137/Screen_Recording_2025-12-26_at_8.46.33_AM_i5xmum.mp4"
                    type="video/mp4"
                  />
                  <track
                    kind="captions"
                    srcLang="en"
                    label="English captions"
                  />
                </video>
                {/* Remove overlays to eliminate visible edge/border */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Layer */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 py-8 lg:py-12 items-center">
          {/* Left Column: Text Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
            <div>
              <div className="inline-flex items-center gap-2 badge-brand mb-0">
                <span className="w-2 h-2 rounded-full bg-brand-1 animate-pulse-glow" />
                Try it today for free
              </div>
            </div>

            <div className="flex gap-3 flex-col w-full">
              <h1 className="text-4xl md:text-6xl lg:text-7xl tracking-tighter font-bold text-text-primary leading-[1.1]">
                <span className="block">Create your</span>
                <span className="relative flex w-full justify-center lg:justify-start overflow-hidden h-[1.2em]">
                  {titles.map((title, index) => (
                    <motion.span
                      key={index}
                      className="absolute font-bold bg-gradient-to-r from-brand-1 via-brand-3 to-brand-2 bg-clip-text text-transparent"
                      initial={{ opacity: 0, y: 50 }}
                      transition={{ type: "spring", stiffness: 50 }}
                      animate={
                        titleNumber === index
                          ? {
                              y: 0,
                              opacity: 1,
                            }
                          : {
                              y: titleNumber > index ? -50 : 50,
                              opacity: 0,
                            }
                      }
                    >
                      {title}
                    </motion.span>
                  ))}
                </span>
                <span className="block">social media feed</span>
              </h1>

              <p className="text-base md:text-lg leading-relaxed tracking-tight text-text-secondary max-w-xl mx-auto lg:mx-0">
                AI summaries, smart tags, and a calm second feed. Stop losing
                great content. Organize, remember, and replay what matters.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
              <Link href="/sign-in" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto gap-2 bg-gradient-to-r from-brand-1 to-brand-2 text-white border-0 hover:shadow-lg hover:shadow-brand-1/20 rounded-full h-11 px-7 text-sm"
                >
                  Try it today for free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="ghost"
                className="w-full sm:w-auto gap-2 text-text-secondary hover:text-brand-1 hover:bg-brand-1-light rounded-full h-11 px-7 text-sm"
                onClick={scrollToFeatures}
              >
                See how it works <ArrowDown className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Right Column */}
          <div className="relative w-full">
            {/* Mobile: Show poster image as fallback */}
            <div className="lg:hidden relative w-full aspect-video rounded-xl bg-surface-solid border border-border-light shadow-xl overflow-hidden">
              <img
                src="https://res.cloudinary.com/dggvt0gzu/video/upload/so_0,f_jpg,q_auto:good,w_800/v1766546298/Screen_Recording_2025-12-23_at_10.11.45_PM_nxxtlj.jpg"
                alt="Tavlo Demo"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>

            {/* Desktop: Spacer (video is in background) */}
            <div className="hidden lg:block h-[660px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export { AnimatedHero };
