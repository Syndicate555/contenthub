import { toast } from "sonner";

interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
}

const RARITY_STYLES: Record<string, { emoji: string; className: string }> = {
  common: { emoji: "🎖️", className: "border-gray-400" },
  rare: { emoji: "💎", className: "border-blue-400" },
  epic: { emoji: "👑", className: "border-purple-400" },
  legendary: { emoji: "⭐", className: "border-yellow-400" },
};

/**
 * Show a toast notification when a single badge is unlocked
 */
export function showBadgeNotification(badge: Badge) {
  const rarityStyle = RARITY_STYLES[badge.rarity] || RARITY_STYLES.common;

  toast.success(`${rarityStyle.emoji} Badge Unlocked: ${badge.name}!`, {
    description: badge.description,
    duration: 5000,
    icon: badge.icon,
    className: rarityStyle.className,
  });
}

/**
 * Show a toast notification when multiple badges are unlocked at once
 */
export function showMultipleBadgesNotification(badges: Badge[]) {
  if (badges.length === 0) return;

  if (badges.length === 1) {
    showBadgeNotification(badges[0]);
    return;
  }

  const badgeNames = badges.map(b => b.name).join(", ");
  const hasLegendary = badges.some(b => b.rarity === "legendary");
  const hasEpic = badges.some(b => b.rarity === "epic");

  const emoji = hasLegendary ? "⭐" : hasEpic ? "👑" : "🎉";
  const rarityClass = hasLegendary
    ? "border-yellow-400"
    : hasEpic
    ? "border-purple-400"
    : "border-blue-400";

  toast.success(`${emoji} ${badges.length} Badges Unlocked!`, {
    description: badgeNames,
    duration: 7000,
    className: rarityClass,
  });
}

/**
 * Show celebration for epic/legendary badges (to be used with confetti in Phase 3)
 */
export function shouldShowCelebration(badge: Badge): boolean {
  return badge.rarity === "epic" || badge.rarity === "legendary";
}
