"use client";

import React, { useEffect, useRef, useState } from "react";

interface CSSRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  once?: boolean;
  amount?: number;
}

/**
 * Lightweight CSS-based reveal animation using Intersection Observer
 * Replaces Framer Motion Reveal for better performance
 */
export const CSSReveal = ({
  children,
  className = "",
  delay = 0,
  direction = "up",
  once = true,
  amount = 0.3,
}: CSSRevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold: amount,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [once, amount]);

  const directionClass = `reveal-${direction}`;
  const visibleClass = isVisible ? "reveal-visible" : "";
  const delayStyle = delay > 0 ? { animationDelay: `${delay}s` } : {};

  return (
    <div
      ref={ref}
      className={`reveal ${directionClass} ${visibleClass} ${className}`}
      style={delayStyle}
    >
      {children}
    </div>
  );
};

export default CSSReveal;
