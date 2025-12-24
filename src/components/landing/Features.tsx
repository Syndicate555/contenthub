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
import { features } from "@/data/landing";
import { CSSReveal } from "@/components/motion";

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

  return (
    <article
      className="group relative bg-surface-solid rounded-2xl p-5 border border-border-light hover:border-brand-1/20 hover:shadow-lg hover:shadow-brand-1/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden focus-within:ring-2 focus-within:ring-brand-1/30"
      tabIndex={0}
    >
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
    </article>
  );
};

const Features = () => {
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
      aria-labelledby="features-heading"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-brand-1/[0.015] to-transparent" />

      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <header className="text-center mb-12">
          <CSSReveal>
            <span className="inline-flex items-center gap-2 badge-brand mb-4">
              Features
            </span>
          </CSSReveal>
          <CSSReveal delay={0.1}>
            <h2
              id="features-heading"
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-4"
            >
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-brand-1 to-brand-3 bg-clip-text text-transparent">
                remember what matters
              </span>
            </h2>
          </CSSReveal>
          <CSSReveal delay={0.2}>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Powerful features designed to turn your saved content into
              reusable knowledge.
            </p>
          </CSSReveal>
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
