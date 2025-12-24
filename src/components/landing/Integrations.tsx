import React from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { XIcon, YouTubeIcon, LinkedInIcon, RedditIcon, TikTokIcon } from './PlatformIcons';
import { Reveal } from '@/components/motion';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      viewport={{ once: true }}
      className="group flex flex-col items-center justify-center p-6 bg-surface-solid rounded-2xl border border-border-light hover:border-brand-1/20 hover:shadow-lg hover:shadow-brand-1/5 transition-shadow transition-colors duration-300"
    >
      <div className={`w-12 h-12 rounded-xl bg-surface flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`w-6 h-6 text-text-secondary transition-colors duration-300 ${item.color}`} />
      </div>
      <span className="text-sm font-medium text-text-primary">{item.name}</span>
    </motion.div>
  );
};

const Integrations = () => {
  return (
    <section className="py-20 md:py-28 px-4 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 badge-brand mb-4">
              Integrations
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-4">
              Connect your favorite{' '}
              <span className="bg-gradient-to-r from-brand-1 to-brand-2 bg-clip-text text-transparent">
                platforms
              </span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Tavlo brings all your saved content together in one unified library.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {integrations.map((item, index) => (
            <IntegrationCard key={item.name} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Integrations;
