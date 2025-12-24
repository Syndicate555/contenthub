import { BackgroundOrbs } from "@/components/motion";
import { AnimatedHero } from "@/components/ui/animated-hero";

const Hero = () => {
  return (
    <section className="relative min-h-fit flex items-center pt-20 pb-0 px-4 overflow-hidden">
      {/* Background */}
      <BackgroundOrbs variant="hero" />

      {/* Mesh gradient base - reduced opacity */}
      <div className="absolute inset-0 -z-20 mesh-gradient-hero opacity-80" />
      <AnimatedHero />
    </section>
  );
};

export default Hero;
