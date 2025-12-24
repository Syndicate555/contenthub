import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Reveal } from "@/components/motion";

const InstagramLottie = ({ className }: { className?: string }) => (
  <div className="w-full h-full flex items-center justify-center scale-[1.7]">
    <DotLottieReact
      src="/animations/instagram-icon.lottie"
      loop
      autoplay
    />
  </div>
);

const TwitterLottie = ({ className }: { className?: string }) => (
  <div className="w-full h-full flex items-center justify-center scale-[1.7]">
    <DotLottieReact
      src="/animations/twitter-icon.lottie"
      loop
      autoplay
    />
  </div>
);

const LinkedInLottie = ({ className }: { className?: string }) => (
  <div className="w-full h-full flex items-center justify-center scale-[1.7]">
    <DotLottieReact
      src="/animations/linkedin-icon.lottie"
      loop
      autoplay
    />
  </div>
);

const YouTubeLottie = ({ className }: { className?: string }) => (
  <div className="w-full h-full flex items-center justify-center scale-[1.7]">
    <DotLottieReact
      src="/animations/youtube-icon.lottie"
      loop
      autoplay
    />
  </div>
);

const TikTokLottie = ({ className }: { className?: string }) => (
  <div className="w-full h-full flex items-center justify-center scale-[1.7]">
    <DotLottieReact
      src="/animations/tiktok-icon.lottie"
      loop
      autoplay
    />
  </div>
);

const RedditLottie = ({ className }: { className?: string }) => (
  <div className="w-full h-full flex items-center justify-center scale-[1.7]">
    <DotLottieReact
      src="/animations/reddit-icon.lottie"
      loop
      autoplay
    />
  </div>
);

const NewsletterLottie = ({ className }: { className?: string }) => (
  <div className="w-full h-full flex items-center justify-center scale-[1.7]">
    <DotLottieReact
      src="/animations/newsletter-icon.lottie"
      loop
      autoplay
    />
  </div>
);

const WebLottie = ({ className }: { className?: string }) => (
  <div className="w-full h-full flex items-center justify-center scale-[1.7]">
    <DotLottieReact
      src="/animations/web-icon.lottie"
      loop
      autoplay
    />
  </div>
);

type IntegrationItem = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
};

const integrations: IntegrationItem[] = [
  { name: 'X / Twitter', icon: TwitterLottie, color: '' },
  { name: 'YouTube', icon: YouTubeLottie, color: '' },
  { name: 'LinkedIn', icon: LinkedInLottie, color: '' },
  { name: 'Instagram', icon: InstagramLottie, color: '' },
  { name: 'Web Articles', icon: WebLottie, color: '' },
  { name: 'Newsletters', icon: NewsletterLottie, color: '' },
  { name: 'Reddit', icon: RedditLottie, color: '' },
  { name: 'TikTok', icon: TikTokLottie, color: '' },
];

const IntegrationCard = ({
  item,
  index,
}: {
  item: IntegrationItem;
  index: number;
}) => {
  const Icon = item.icon;
  
  return (
    <div className="group flex flex-col items-center justify-center px-4 py-3 bg-surface-solid rounded-xl border border-border-light/70 hover:border-brand-1/30 hover:shadow-md hover:shadow-brand-1/10 transition duration-300 min-w-[150px]">
      <div className="w-11 h-11 rounded-lg bg-surface flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
        <Icon className={`w-6 h-6 text-text-secondary transition-colors duration-300 ${item.color}`} />
      </div>
      <span className="text-xs font-semibold text-text-primary whitespace-nowrap">
        {item.name}
      </span>
    </div>
  );
};

const Integrations = () => {
  const prefersReducedMotion = useReducedMotion();

  // Duplicate items for seamless marquee loop
  const scrollingItems = useMemo(
    () => [...integrations, ...integrations],
    [],
  );

  const marqueeAnimation = prefersReducedMotion
    ? {}
    : {
        initial: { x: "-50%" },
        animate: { x: "0%" },
        transition: {
          duration: 28,
          repeat: Infinity,
          ease: "linear",
        },
      };

  return (
    <section className="py-12 md:py-14 px-4 relative overflow-hidden">
      <div className="max-w-5xl mx-auto text-center mb-6">
        <Reveal>
          <span className="inline-flex items-center gap-2 badge-brand mb-3">
            Integrations
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-lg md:text-xl font-semibold text-text-primary">
            Connect your favorite{" "}
            <span className="bg-gradient-to-r from-brand-1 to-brand-2 bg-clip-text text-transparent">
              platforms
            </span>
          </p>
        </Reveal>
      </div>

      {/* Full-width marquee rail */}
      <div className="relative w-screen left-1/2 -translate-x-1/2 px-4 md:px-8">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bg-page via-bg-page/80 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg-page via-bg-page/80 to-transparent z-10" />

        <div className="overflow-hidden rounded-2xl border border-border-light/60 bg-surface-solid/80 backdrop-blur-sm shadow-[0_10px_40px_-18px_rgba(0,0,0,0.18)]">
          <motion.div
            className="flex items-center gap-3 py-4 px-2"
            {...marqueeAnimation}
          >
            {scrollingItems.map((item, index) => (
              <IntegrationCard key={`${item.name}-${index}`} item={item} index={index} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Integrations;
