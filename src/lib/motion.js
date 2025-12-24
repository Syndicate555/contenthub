// Shared motion configuration for Tavlo
// Use with Framer Motion

export const DURATION = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
};

export const EASING = {
  smooth: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
};

// Reveal animation variants
export const revealVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.slow,
      ease: EASING.smooth,
    },
  },
};

// Stagger container variants
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Stagger item variants
export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.smooth,
    },
  },
};

// Fade variants
export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASING.smooth,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: DURATION.fast,
    },
  },
};

// Scale variants for cards
export const scaleVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASING.smooth,
    },
  },
};

// Slide variants
export const slideUpVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.slow,
      ease: EASING.smooth,
    },
  },
};

export const slideInLeftVariants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: DURATION.slow,
      ease: EASING.smooth,
    },
  },
};

export const slideInRightVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: DURATION.slow,
      ease: EASING.smooth,
    },
  },
};
