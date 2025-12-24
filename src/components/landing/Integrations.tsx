"use client";

import React, { useState } from "react";
import {
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Mail,
  Globe,
} from "lucide-react";
import { CSSReveal } from "@/components/motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

// Custom TikTok icon
const TikTokIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

// Custom Reddit icon
const RedditIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

type IntegrationItem = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  lottieUrl: string;
  bgGradient: string;
};

const integrations: IntegrationItem[] = [
  {
    name: "X / Twitter",
    icon: Twitter,
    colorClass: "text-[#1DA1F2]",
    lottieUrl: "/animations/twitter-icon.lottie",
    bgGradient: "from-[#1DA1F2]/10 to-[#0C85D0]/10",
  },
  {
    name: "YouTube",
    icon: Youtube,
    colorClass: "text-[#FF0000]",
    lottieUrl: "/animations/youtube-icon.lottie",
    bgGradient: "from-[#FF0000]/10 to-[#CC0000]/10",
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    colorClass: "text-[#0A66C2]",
    lottieUrl: "/animations/linkedin-icon.lottie",
    bgGradient: "from-[#0A66C2]/10 to-[#004182]/10",
  },
  {
    name: "Instagram",
    icon: Instagram,
    colorClass: "text-[#E4405F]",
    lottieUrl: "/animations/instagram-icon.lottie",
    bgGradient: "from-[#E4405F]/10 via-[#C13584]/10 to-[#F77737]/10",
  },
  {
    name: "Web Articles",
    icon: Globe,
    colorClass: "text-[#10B981]",
    lottieUrl: "/animations/web-icon.lottie",
    bgGradient: "from-[#10B981]/10 to-[#059669]/10",
  },
  {
    name: "Newsletters",
    icon: Mail,
    colorClass: "text-[#8B5CF6]",
    lottieUrl: "/animations/newsletter-icon.lottie",
    bgGradient: "from-[#8B5CF6]/10 to-[#7C3AED]/10",
  },
  {
    name: "Reddit",
    icon: RedditIcon,
    colorClass: "text-[#FF4500]",
    lottieUrl: "/animations/reddit-icon.lottie",
    bgGradient: "from-[#FF4500]/10 to-[#FF5700]/10",
  },
  {
    name: "TikTok",
    icon: TikTokIcon,
    colorClass: "text-[#000000] dark:text-[#FF0050]",
    lottieUrl: "/animations/tiktok-icon.lottie",
    bgGradient: "from-[#FF0050]/10 via-[#00F2EA]/10 to-[#000000]/10",
  },
];

const IntegrationCard = ({
  item,
  index,
  isHovered,
  onHover,
}: {
  item: IntegrationItem;
  index: number;
  isHovered: boolean;
  onHover: (name: string | null) => void;
}) => {
  const Icon = item.icon;

  return (
    <div
      className="group flex flex-col items-center justify-center px-4 py-3 bg-surface-solid rounded-xl border border-border-light/70 hover:border-current transition-all duration-300 min-w-[150px] cursor-pointer"
      onMouseEnter={() => onHover(item.name)}
      onMouseLeave={() => onHover(null)}
      style={{
        borderColor: isHovered ? `${item.colorClass}40` : undefined,
      }}
    >
      <div
        className={`w-11 h-11 rounded-lg bg-gradient-to-br ${item.bgGradient} flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-110 integration-icon-wrapper`}
      >
        {isHovered ? (
          <div className="w-full h-full flex items-center justify-center scale-[1.4]">
            <DotLottieReact
              src={item.lottieUrl}
              loop
              autoplay
              className="w-full h-full"
            />
          </div>
        ) : (
          <Icon
            className={`w-6 h-6 ${item.colorClass} transition-all duration-300 integration-icon`}
          />
        )}
      </div>
      <span className="text-xs font-semibold text-text-primary whitespace-nowrap group-hover:text-brand-1 transition-colors">
        {item.name}
      </span>
    </div>
  );
};

const Integrations = () => {
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  // Duplicate items for seamless marquee loop
  const scrollingItems = [...integrations, ...integrations];

  return (
    <section className="py-12 md:py-14 px-4 relative overflow-hidden">
      <div className="max-w-5xl mx-auto text-center mb-6">
        <CSSReveal>
          <span className="inline-flex items-center gap-2 badge-brand mb-3">
            Integrations
          </span>
        </CSSReveal>
        <CSSReveal delay={0.1}>
          <p className="text-lg md:text-xl font-semibold text-text-primary">
            Connect your favorite{" "}
            <span className="bg-gradient-to-r from-brand-1 to-brand-2 bg-clip-text text-transparent">
              platforms
            </span>
          </p>
        </CSSReveal>
      </div>

      {/* Full-width marquee rail */}
      <div className="relative w-screen left-1/2 -translate-x-1/2 px-4 md:px-8">
        <div className="overflow-hidden rounded-2xl border border-border-light/60 bg-surface-solid/80 backdrop-blur-sm shadow-[0_10px_40px_-18px_rgba(0,0,0,0.18)]">
          <div className="marquee-container py-4 px-2">
            <div className="marquee-content flex items-center gap-3">
              {scrollingItems.map((item, index) => (
                <IntegrationCard
                  key={`${item.name}-${index}`}
                  item={item}
                  index={index}
                  isHovered={hoveredIcon === item.name}
                  onHover={setHoveredIcon}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Integrations;
