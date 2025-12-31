"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

interface UserStats {
  totalXp: number;
  itemsProcessed: number;
  currentStreak: number;
  longestStreak: number;
}

interface BadgeDetailModalProps {
  badge: Badge | null;
  userStats?: UserStats;
  isOpen: boolean;
  onClose: () => void;
}

const RARITY_COLORS: Record<
  string,
  { bg: string; border: string; glow: string; text: string }
> = {
  common: {
    bg: "bg-gray-50 dark:bg-gray-800/50",
    border: "border-gray-300 dark:border-gray-600",
    glow: "shadow-gray-200 dark:shadow-gray-700",
    text: "text-gray-700 dark:text-gray-300",
  },
  rare: {
    bg: "bg-blue-50 dark:bg-blue-950/50",
    border: "border-blue-400 dark:border-blue-600",
    glow: "shadow-blue-200 dark:shadow-blue-800",
    text: "text-blue-700 dark:text-blue-400",
  },
  epic: {
    bg: "bg-purple-50 dark:bg-purple-950/50",
    border: "border-purple-400 dark:border-purple-600",
    glow: "shadow-purple-200 dark:shadow-purple-800",
    text: "text-purple-700 dark:text-purple-400",
  },
  legendary: {
    bg: "bg-yellow-50 dark:bg-yellow-950/50",
    border: "border-yellow-400 dark:border-yellow-600",
    glow: "shadow-yellow-200 dark:shadow-yellow-800",
    text: "text-yellow-700 dark:text-yellow-400",
  },
};

/**
 * Calculate progress toward unlocking a badge
 */
function calculateProgress(
  badge: Badge,
  stats?: UserStats,
): { current: number; target: number; percentage: number } {
  if (!badge.criteriaType || !badge.criteriaValue || !stats) {
    return { current: 0, target: 0, percentage: 0 };
  }

  let current = 0;
  const target = badge.criteriaValue;

  switch (badge.criteriaType) {
    case "item_count":
      current = stats.itemsProcessed;
      break;
    case "streak":
      current = Math.max(stats.currentStreak, stats.longestStreak);
      break;
    case "xp_total":
      current = stats.totalXp;
      break;
    case "domain_level":
      // For domain level badges, we'd need domain-specific data
      // For now, return 0
      current = 0;
      break;
  }

  const percentage = Math.min(Math.round((current / target) * 100), 100);

  return { current, target, percentage };
}

/**
 * Get a call-to-action message based on badge type
 */
function getCallToAction(badge: Badge): string {
  if (!badge.criteriaType)
    return "Complete the challenge to unlock this badge!";

  switch (badge.criteriaType) {
    case "item_count":
      return "Keep saving content to unlock this badge!";
    case "streak":
      return "Maintain your daily streak to earn this badge!";
    case "xp_total":
      return "Keep engaging to earn more XP!";
    case "domain_level":
      return "Focus on mastering a specific domain!";
    default:
      return "Complete the challenge to unlock this badge!";
  }
}

/**
 * Format criteria value for display
 */
function formatCriteriaValue(badge: Badge): string {
  if (!badge.criteriaValue) return "";

  switch (badge.criteriaType) {
    case "item_count":
      return `${badge.criteriaValue} item${badge.criteriaValue !== 1 ? "s" : ""}`;
    case "streak":
      return `${badge.criteriaValue}-day streak`;
    case "xp_total":
      return `${badge.criteriaValue.toLocaleString()} XP`;
    case "domain_level":
      return `Level ${badge.criteriaValue}`;
    default:
      return String(badge.criteriaValue);
  }
}

export function BadgeDetailModal({
  badge,
  userStats,
  isOpen,
  onClose,
}: BadgeDetailModalProps) {
  if (!badge) return null;

  const isEarned = badge.earned;
  const rarityStyle = RARITY_COLORS[badge.rarity] || RARITY_COLORS.common;
  const progress = !isEarned ? calculateProgress(badge, userStats) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">{badge.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Badge Icon with Rarity Styling */}
          <div className="flex justify-center">
            <div
              className={`relative p-8 rounded-2xl border-4 ${rarityStyle.bg} ${rarityStyle.border} shadow-lg ${rarityStyle.glow} ${
                !isEarned ? "opacity-60 grayscale" : ""
              }`}
            >
              <div className="text-7xl">{badge.icon}</div>
            </div>
          </div>

          {/* Badge Name and Rarity */}
          <div className="text-center space-y-2">
            <h2 className={`text-2xl font-bold ${rarityStyle.text}`}>
              {badge.name}
            </h2>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {badge.rarity} Badge
            </p>
          </div>

          {/* Description */}
          <p className="text-center text-muted-foreground leading-relaxed">
            {badge.description}
          </p>

          {/* Earned Info or Progress */}
          {isEarned && badge.awardedAt ? (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Unlocked{" "}
                {formatDistanceToNow(new Date(badge.awardedAt), {
                  addSuffix: true,
                })}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">🎉 Congratulations!</p>
            </div>
          ) : progress ? (
            <div className="space-y-3">
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-foreground">Progress</span>
                  <span className="text-muted-foreground">
                    {progress.current.toLocaleString()} /{" "}
                    {progress.target.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {progress.percentage}% complete
                </p>
              </div>

              {/* Criteria */}
              <div className="bg-muted border border-border rounded-lg p-4">
                <p className="text-sm text-foreground text-center">
                  <span className="font-medium">Goal:</span>{" "}
                  {formatCriteriaValue(badge)}
                </p>
              </div>

              {/* Call to Action */}
              <p className="text-sm text-center text-muted-foreground italic">
                {getCallToAction(badge)}
              </p>
            </div>
          ) : null}

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full"
            variant={isEarned ? "default" : "outline"}
          >
            {isEarned ? "Awesome!" : "Got it"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
