"use client";

import React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";

interface OrbProps {
  className?: string;
  color?: string;
  size?: number;
  top?: string | number;
  left?: string | number;
  right?: string | number;
  bottom?: string | number;
  parallaxSpeed?: number;
  blur?: number;
}

const Orb = ({
  className = "",
  color = "from-brand-1/30 to-brand-2/20",
  size = 400,
  top,
  left,
  right,
  bottom,
  parallaxSpeed = 0.3,
  blur = 80,
}: OrbProps) => {
  const { scrollYProgress } = useScroll();
  const prefersReducedMotion = useReducedMotion();

  const y = useTransform(scrollYProgress, [0, 1], [0, 200 * parallaxSpeed]);

  const style = {
    width: size,
    height: size,
    top,
    left,
    right,
    bottom,
    filter: `blur(${blur}px)`,
  };

  if (prefersReducedMotion) {
    return (
      <div
        className={`absolute rounded-full bg-gradient-to-br ${color} ${className}`}
        style={style}
      />
    );
  }

  return (
    <motion.div
      className={`absolute rounded-full bg-gradient-to-br ${color} ${className}`}
      style={{ ...style, y }}
    />
  );
};

export const BackgroundOrbs = ({
  variant = "hero",
}: {
  variant?: "hero" | "demo";
}) => {
  if (variant === "hero") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Main indigo orb */}
        <Orb
          color="from-brand-1/25 to-brand-1/5"
          size={600}
          top="-10%"
          right="-10%"
          parallaxSpeed={0.2}
          blur={100}
        />
        {/* Cyan orb */}
        <Orb
          color="from-brand-2/20 to-brand-2/5"
          size={500}
          bottom="10%"
          left="-15%"
          parallaxSpeed={0.4}
          blur={90}
        />
        {/* Small violet accent */}
        <Orb
          color="from-brand-3/20 to-brand-3/5"
          size={300}
          top="40%"
          right="20%"
          parallaxSpeed={0.3}
          blur={70}
        />
      </div>
    );
  }

  if (variant === "demo") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <Orb
          color="from-brand-2/15 to-brand-1/10"
          size={500}
          top="20%"
          left="-10%"
          parallaxSpeed={0.25}
          blur={90}
        />
        <Orb
          color="from-brand-3/15 to-brand-2/10"
          size={400}
          bottom="10%"
          right="-5%"
          parallaxSpeed={0.35}
          blur={80}
        />
      </div>
    );
  }

  return null;
};

export default BackgroundOrbs;
