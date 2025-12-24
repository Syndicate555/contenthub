import { useRef, type MouseEvent } from "react";
import {
  FileText,
  Tags,
  Search,
  Layers,
  Repeat,
  Globe,
  Users,
  Download,
  Shield,
} from "lucide-react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { features } from "@/data/landing";
import { Reveal } from "@/components/motion";

const iconMap = {
  FileText,
  Tags,
  Search,
  Layers,
  Repeat,
  Globe,
  Users,
  Download,
  Shield,
};

type FeatureIconKey = keyof typeof iconMap;

interface FeatureItem {
  title: string;
  description: string;
  icon: FeatureIconKey;
  comingSoon?: boolean;
}

const FeatureCard = ({
  feature,
  index,
}: {
  feature: FeatureItem;
  index: number;
}) => {
  const IconComponent = iconMap[feature.icon] ?? FileText;
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty("--mouse-x", `${x}%`);
    cardRef.current.style.setProperty("--mouse-y", `${y}%`);
  };

  return (
    <motion.article
      ref={cardRef}
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={
        prefersReducedMotion
          ? {}
          : {
              y: -4,
              transition: { duration: 0.2 },
            }
      }
      className="group relative bg-surface-solid rounded-2xl p-5 border border-border-light transition-colors duration-300 overflow-hidden focus-within:ring-2 focus-within:ring-brand-1/30"
      onMouseMove={handleMouseMove}
      tabIndex={0}
    >
      {/* Spotlight effect - softer */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(91, 91, 255, 0.04), transparent 40%)`,
        }}
      />

      {/* Edge highlight */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div
          className="absolute inset-[1px] rounded-2xl bg-gradient-to-br from-white/50 via-transparent to-transparent"
          style={{ height: "50%" }}
        />
      </div>

      {/* Shadow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xl shadow-brand-1/10 pointer-events-none" />

      <div className="flex items-start gap-4 relative z-10">
        <div
          className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-1-light via-brand-3-light to-brand-2-light flex items-center justify-center flex-shrink-0 border border-brand-1/10 group-hover:scale-105 transition-transform"
          aria-hidden="true"
        >
          <IconComponent className="w-5 h-5 text-brand-1" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-base font-semibold text-text-primary group-hover:text-brand-1 transition-colors">
              {feature.title}
            </h3>
            {feature.comingSoon && (
              <span className="px-2 py-0.5 bg-brand-3-light text-brand-3 text-xs font-medium rounded-full">
                Soon
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>
    </motion.article>
  );
};

const Features = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  const typedFeatures: FeatureItem[] = (features as Array<any>).map((item) => {
    const iconKey: FeatureIconKey = (
      item.icon in iconMap ? item.icon : "FileText"
    ) as FeatureIconKey;
    return {
      title: String(item.title ?? ""),
      description: String(item.description ?? ""),
      icon: iconKey,
      comingSoon: Boolean(item.comingSoon),
    };
  });

  return (
    <section
      id="features"
      className="py-16 md:py-20 px-4 relative"
      ref={sectionRef}
      aria-labelledby="features-heading"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-brand-1/[0.015] to-transparent" />

      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <header className="text-center mb-12">
          <Reveal>
            <span className="inline-flex items-center gap-2 badge-brand mb-4">
              Features
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2
              id="features-heading"
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-4"
            >
              Everything you need to{" "}
              <motion.span
                className="bg-gradient-to-r from-brand-1 to-brand-3 bg-clip-text text-transparent inline-block"
                initial={{ filter: "blur(10px)", opacity: 0 }}
                animate={isInView ? { filter: "blur(0px)", opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                remember what matters
              </motion.span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Powerful features designed to turn your saved content into
              reusable knowledge.
            </p>
          </Reveal>
        </header>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {typedFeatures.map((feature, index) => (
            <FeatureCard
              key={`${feature.title}-${index}`}
              feature={feature}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
