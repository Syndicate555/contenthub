import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function AnimatedHero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["knowledge", "insights", "action", "results"],
    [],
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
    const element = document.getElementById("features");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="w-full relative z-10">
      <div className="container mx-auto px-4">
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
                <span className="block">Turn saved posts into</span>
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
                <span className="block">you actually reuse</span>
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

          {/* Right Column: Demo Video */}
          <div className="relative w-full aspect-video rounded-xl bg-surface-solid border border-border-light shadow-2xl overflow-hidden group">
            {/* Video */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect fill='%23f5f5f5' width='16' height='9'/%3E%3C/svg%3E"
            >
              <source
                src="https://res.cloudinary.com/dggvt0gzu/video/upload/v1766546298/Screen_Recording_2025-12-23_at_10.11.45_PM_nxxtlj.mp4"
                type="video/mp4"
              />
            </video>

            {/* Subtle overlay for premium feel */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/5 via-transparent to-white/5 pointer-events-none" />

            {/* Optional: Subtle glow border on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.3)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { AnimatedHero };
