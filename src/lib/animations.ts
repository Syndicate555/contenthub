import type { Variants } from "framer-motion";

// Entry Animations
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const bounceIn: Variants = {
  initial: { opacity: 0, scale: 0.3 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
};

// Container Animations
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
    },
  },
};

// Slide Animations
export const slideIn: Variants = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
};

export const slideInRight: Variants = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 },
};

// Transition Configs
export const springBounce = {
  type: "spring" as const,
  stiffness: 200,
  damping: 15,
};

export const smoothTransition = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export const fastTransition = {
  duration: 0.15,
  ease: "easeOut" as const,
};

// Hover Animations
export const hoverLift = {
  whileHover: {
    y: -4,
    scale: 1.02,
    transition: { duration: 0.2 },
  },
  whileTap: { scale: 0.98 },
};

export const hoverScale = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
};

export const hoverGlow = {
  whileHover: {
    boxShadow: "0 0 25px rgba(168, 85, 247, 0.5)",
    transition: { duration: 0.3 },
  },
};
