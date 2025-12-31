"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
}

interface BadgeCelebrationProps {
  badge: Badge;
  isOpen: boolean;
  onClose: () => void;
}

const RARITY_CONFETTI_COLORS: Record<string, string[]> = {
  common: ["#9CA3AF", "#D1D5DB"],
  rare: ["#60A5FA", "#93C5FD", "#DBEAFE"],
  epic: ["#A78BFA", "#C4B5FD", "#EDE9FE"],
  legendary: ["#FBBF24", "#FCD34D", "#FEF3C7"],
};

/**
 * Trigger confetti celebration based on badge rarity
 */
function triggerConfetti(rarity: string) {
  const colors =
    RARITY_CONFETTI_COLORS[rarity] || RARITY_CONFETTI_COLORS.common;
  const duration =
    rarity === "legendary" ? 5000 : rarity === "epic" ? 3000 : 2000;
  const particleCount =
    rarity === "legendary" ? 150 : rarity === "epic" ? 100 : 50;

  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: rarity === "legendary" ? 10 : 5,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors,
    });

    confetti({
      particleCount: rarity === "legendary" ? 10 : 5,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();

  // Center burst for legendary badges
  if (rarity === "legendary") {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });
  }
}

/**
 * Full-screen celebration modal for epic and legendary badges
 */
export function BadgeCelebration({
  badge,
  isOpen,
  onClose,
}: BadgeCelebrationProps) {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti
      triggerConfetti(badge.rarity);

      // Auto-close after celebration duration
      const duration = badge.rarity === "legendary" ? 5000 : 3000;
      const timer = setTimeout(onClose, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, badge.rarity, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div className="relative animate-in zoom-in duration-500">
        {/* Badge Container */}
        <div className="bg-card rounded-3xl p-12 shadow-2xl max-w-md mx-4 text-center space-y-6">
          {/* Badge Icon with Bounce Animation */}
          <div className="animate-bounce">
            <div className="text-8xl mb-4">{badge.icon}</div>
          </div>

          {/* Celebration Message */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Badge Unlocked!
            </h2>
            <h3 className="text-2xl font-bold text-foreground">{badge.name}</h3>
          </div>

          {/* Badge Description */}
          <p className="text-muted-foreground leading-relaxed">{badge.description}</p>

          {/* Rarity Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/50 dark:to-yellow-800/50 rounded-full">
            <span className="text-sm font-bold text-yellow-800 dark:text-yellow-300 uppercase tracking-wide">
              {badge.rarity} Badge
            </span>
            {badge.rarity === "legendary" && (
              <span className="text-yellow-600 dark:text-yellow-400">⭐</span>
            )}
            {badge.rarity === "epic" && (
              <span className="text-purple-600 dark:text-purple-400">👑</span>
            )}
          </div>

          {/* Congratulations Message */}
          <p className="text-2xl">🎉</p>
          <p className="text-sm text-muted-foreground">Click anywhere to continue</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to check if a badge should trigger celebration
 */
export function shouldShowCelebration(badge: Badge): boolean {
  return badge.rarity === "epic" || badge.rarity === "legendary";
}
