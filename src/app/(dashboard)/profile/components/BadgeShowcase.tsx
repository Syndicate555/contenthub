"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Lock } from "lucide-react";
import { BadgeDetailModal } from "@/components/badge-detail-modal";

interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  awardedAt?: string;
  earned?: boolean;
  criteriaType?: string;
  criteriaValue?: number;
  seenAt?: string | null;
}

interface BadgeStats {
  total: number;
  earned: number;
  progress: number;
  unseen?: number;
}

interface UserStats {
  totalXp: number;
  itemsProcessed: number;
  currentStreak: number;
  longestStreak: number;
}

interface BadgeShowcaseProps {
  badges: Badge[];
  badgeStats?: BadgeStats;
  userStats?: UserStats;
}

const RARITY_COLORS: Record<string, string> = {
  common: "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50",
  rare: "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/50",
  epic: "border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-950/50",
  legendary: "border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950/50",
};

const RARITY_TEXT: Record<string, string> = {
  common: "text-gray-700 dark:text-gray-300",
  rare: "text-blue-700 dark:text-blue-400",
  epic: "text-purple-700 dark:text-purple-400",
  legendary: "text-yellow-700 dark:text-yellow-400",
};

const LOCKED_STYLE = "opacity-50 grayscale";

/**
 * Format badge criteria as user-friendly text
 */
function getCriteriaText(badge: Badge): string {
  if (!badge.criteriaType || badge.criteriaValue === undefined) {
    return "Complete the challenge to unlock!";
  }

  switch (badge.criteriaType) {
    case "item_count":
      return `Save ${badge.criteriaValue} item${badge.criteriaValue !== 1 ? "s" : ""}`;
    case "streak":
      return `Maintain a ${badge.criteriaValue}-day streak`;
    case "xp_total":
      return `Earn ${badge.criteriaValue.toLocaleString()} XP`;
    case "domain_level":
      return `Reach level ${badge.criteriaValue} in any domain`;
    default:
      return "Complete the challenge to unlock!";
  }
}

/**
 * Sort badges: earned first (by rarity, then date), locked second (by rarity, then criteria value)
 */
function sortBadges(badges: Badge[]): Badge[] {
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };

  return [...badges].sort((a, b) => {
    // Earned badges come first
    const earnedDiff = (b.earned ? 1 : 0) - (a.earned ? 1 : 0);
    if (earnedDiff !== 0) return earnedDiff;

    // Within earned/locked groups, sort by rarity
    const rarityDiff =
      (rarityOrder[a.rarity as keyof typeof rarityOrder] || 99) -
      (rarityOrder[b.rarity as keyof typeof rarityOrder] || 99);
    if (rarityDiff !== 0) return rarityDiff;

    // For earned badges, sort by date (newest first)
    if (a.earned && b.earned && a.awardedAt && b.awardedAt) {
      return new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime();
    }

    // For locked badges, sort by criteria value (easier challenges first)
    if (!a.earned && !b.earned) {
      const aValue = a.criteriaValue || 0;
      const bValue = b.criteriaValue || 0;
      return aValue - bValue;
    }

    return 0;
  });
}

export function BadgeShowcase({
  badges,
  badgeStats,
  userStats,
}: BadgeShowcaseProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const total = badgeStats?.total || badges.length || 14;
  const earned = badgeStats?.earned || badges.filter((b) => b.earned).length;

  // Mark badge as seen when modal opens
  useEffect(() => {
    if (
      isModalOpen &&
      selectedBadge &&
      selectedBadge.earned &&
      !selectedBadge.seenAt
    ) {
      // Mark this badge as seen
      fetch("/api/badges/mark-seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeIds: [selectedBadge.id] }),
      }).catch((error) =>
        console.error("Failed to mark badge as seen:", error),
      );
    }
  }, [isModalOpen, selectedBadge]);

  const handleBadgeClick = (badge: Badge) => {
    setSelectedBadge(badge);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Small delay before clearing selectedBadge to allow modal animation to complete
    setTimeout(() => setSelectedBadge(null), 300);
  };

  if (badges.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Badges</h2>
          <span className="text-sm text-muted-foreground">0 / {total}</span>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-sm">No badges available yet</p>
          <p className="text-xs mt-1">Start saving items to unlock badges!</p>
        </div>
      </div>
    );
  }

  const sortedBadges = sortBadges(badges);

  return (
    <>
      <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Badges</h2>
          <span className="text-sm text-muted-foreground">
            {earned} / {total}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sortedBadges.map((badge) => {
            const isLocked = !badge.earned;
            const isNew = badge.earned && !badge.seenAt;
            const criteriaText = isLocked ? getCriteriaText(badge) : "";
            const tooltipText = isLocked
              ? `${badge.name} - ${criteriaText}`
              : `${badge.name} - ${badge.description}`;

            return (
              <div
                key={badge.id}
                onClick={() => handleBadgeClick(badge)}
                className={`group relative rounded-lg p-4 border-2 transition-all hover:scale-105 hover:shadow-md cursor-pointer ${
                  RARITY_COLORS[badge.rarity] || RARITY_COLORS.common
                } ${isLocked ? LOCKED_STYLE : ""}`}
                title={tooltipText}
              >
                {/* NEW Badge Indicator */}
                {isNew && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <span className="flex h-6 w-6">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 items-center justify-center">
                        <span className="text-[10px] font-bold text-white">
                          NEW
                        </span>
                      </span>
                    </span>
                  </div>
                )}

                {/* Lock icon for locked badges */}
                {isLocked && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}

                {/* Badge Icon */}
                <div className="text-4xl text-center mb-2">{badge.icon}</div>

                {/* Badge Name */}
                <div
                  className={`text-center text-sm font-semibold ${
                    RARITY_TEXT[badge.rarity] || RARITY_TEXT.common
                  }`}
                >
                  {badge.name}
                </div>

                {/* Rarity Label */}
                <div className="text-center text-xs text-muted-foreground mt-1 capitalize">
                  {badge.rarity}
                </div>

                {/* Earned Date (earned badges only) or Criteria (locked badges) - Tooltip */}
                {badge.earned && badge.awardedAt ? (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg">
                      {formatDistanceToNow(new Date(badge.awardedAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap max-w-[200px] text-center">
                      {criteriaText}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Message */}
        <div className="mt-6 pt-4 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            {earned < total
              ? `${total - earned} more badge${total - earned !== 1 ? "s" : ""} to unlock!`
              : "All badges unlocked! 🎉"}
          </p>
          {badgeStats && earned > 0 && earned < total && (
            <div className="mt-2 w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-full transition-all duration-500"
                style={{ width: `${badgeStats.progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Badge Detail Modal */}
      <BadgeDetailModal
        badge={selectedBadge}
        userStats={userStats}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
