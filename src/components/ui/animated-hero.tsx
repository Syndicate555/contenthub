import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowDown, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function AnimatedHero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["knowledge", "insights", "action", "results"],
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
    const element = document.getElementById("features");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="w-full relative z-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 py-20 lg:py-32 items-center">
          
          {/* Left Column: Text Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-8">
            <div>
              <div className="inline-flex items-center gap-2 badge-brand mb-0">
                <span className="w-2 h-2 rounded-full bg-brand-1 animate-pulse-glow" />
                Try it today for free
              </div>
            </div>
            
            <div className="flex gap-4 flex-col w-full">
              <h1 className="text-5xl md:text-7xl tracking-tighter font-bold text-text-primary leading-[1.1]">
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

              <p className="text-lg md:text-xl leading-relaxed tracking-tight text-text-secondary max-w-xl mx-auto lg:mx-0">
                AI summaries, smart tags, and a calm second feed. Stop losing
                great content. Organize, remember, and replay what matters.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link href="/sign-in" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 bg-gradient-to-r from-brand-1 to-brand-2 text-white border-0 hover:shadow-lg hover:shadow-brand-1/20 rounded-full h-12 px-8 text-base">
                  Try it today for free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="ghost" className="w-full sm:w-auto gap-2 text-text-secondary hover:text-brand-1 hover:bg-brand-1-light rounded-full h-12 px-8 text-base" onClick={scrollToFeatures}>
                See how it works <ArrowDown className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Right Column: Video Placeholder */}
          <div className="relative w-full aspect-video rounded-xl bg-surface-solid border border-border-light shadow-2xl flex items-center justify-center overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-1/5 to-brand-2/5 opacity-50" />
            <div className="relative z-10 flex flex-col items-center gap-4 text-text-muted">
              <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Play className="w-6 h-6 text-brand-1 ml-1" />
              </div>
              <p className="font-medium">Library Demo Video</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export { AnimatedHero };
