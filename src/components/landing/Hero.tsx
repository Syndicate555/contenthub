import React from "react";
import { BackgroundOrbs } from "@/components/motion";
import { AnimatedHero } from "@/components/ui/animated-hero";
import { PlatformTrustRow } from "./PlatformIcons";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 pb-12 px-4 overflow-hidden">
      {/* Background */}
      <BackgroundOrbs variant="hero" />

      {/* Mesh gradient base - reduced opacity */}
      <div className="absolute inset-0 -z-20 mesh-gradient-hero opacity-80" />

      <AnimatedHero />
      
      {/* Platform trust row - positioned absolutely or after hero */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <PlatformTrustRow />
      </div>
    </section>
  );
};

export default Hero;
