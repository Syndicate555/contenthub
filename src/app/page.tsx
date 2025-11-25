import { Sora } from "next/font/google";
import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { FlowStrip } from "@/components/landing/FlowStrip";
import { GamificationTeaser } from "@/components/landing/GamificationTeaser";
import { Integrations } from "@/components/landing/Integrations";
import { CTASection } from "@/components/landing/CTASection";

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export default function HomePage() {
  return (
    <main className="bg-white text-gray-900">
      <Hero displayFontClass={sora.className} />
      <FlowStrip />
      <FeatureGrid />
      <GamificationTeaser />
      <Integrations />
      <CTASection />
    </main>
  );
}
