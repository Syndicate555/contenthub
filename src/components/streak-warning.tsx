"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Flame, CheckCircle } from "lucide-react";
import useSWR from "swr";

interface StreakStatus {
  currentStreak: number;
  hasActivityToday: boolean;
  lastActivityAt: Date | null;
  hoursRemaining: number;
  warningLevel: "none" | "mild" | "urgent";
  warningMessage: string | null;
  timezone: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((data) => data.data);

/**
 * Streak Warning Component
 * Displays a warning banner when user's streak is at risk
 *
 * - Shows green checkmark if user has activity today
 * - Shows mild warning (yellow) if < 6 hours remaining
 * - Shows urgent warning (red) if < 2 hours remaining
 * - Hidden if no active streak or already has activity today
 */
export function StreakWarning() {
  const { data: status, error } = useSWR<StreakStatus>(
    "/api/streak/status",
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      revalidateOnFocus: true,
    }
  );

  // Don't show anything while loading or if there's an error
  if (error || !status) return null;

  // Don't show if user has no streak
  if (status.currentStreak === 0) return null;

  // Success state: user has activity today
  if (status.hasActivityToday) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-green-900 flex items-center gap-2">
            <Flame className="w-4 h-4" />
            {status.currentStreak}-day streak maintained!
          </h3>
          <p className="text-sm text-green-700 mt-1">
            Great job! You've completed your daily activity. Keep up the momentum.
          </p>
        </div>
      </div>
    );
  }

  // Warning states: user has streak but no activity today
  if (status.warningLevel === "none") {
    // No urgency yet, don't show banner
    return null;
  }

  const isUrgent = status.warningLevel === "urgent";

  return (
    <div
      className={`border rounded-lg p-4 flex items-start gap-3 ${
        isUrgent
          ? "bg-red-50 border-red-200"
          : "bg-yellow-50 border-yellow-200"
      }`}
    >
      <AlertCircle
        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
          isUrgent ? "text-red-600" : "text-yellow-600"
        }`}
      />
      <div className="flex-1">
        <h3
          className={`text-sm font-semibold flex items-center gap-2 ${
            isUrgent ? "text-red-900" : "text-yellow-900"
          }`}
        >
          <Flame className="w-4 h-4" />
          {isUrgent ? "Streak at risk!" : "Don't forget your streak"}
        </h3>
        <p
          className={`text-sm mt-1 ${
            isUrgent ? "text-red-700" : "text-yellow-700"
          }`}
        >
          {status.warningMessage}
        </p>
        <p className="text-xs text-gray-600 mt-2">
          Save, process, or review an item to maintain your streak.
        </p>
      </div>
    </div>
  );
}

/**
 * Compact streak warning for use in headers/sidebars
 */
export function CompactStreakWarning() {
  const { data: status } = useSWR<StreakStatus>(
    "/api/streak/status",
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000,
    }
  );

  if (!status || status.currentStreak === 0 || status.hasActivityToday) {
    return null;
  }

  if (status.warningLevel === "none") return null;

  const isUrgent = status.warningLevel === "urgent";

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
        isUrgent
          ? "bg-red-100 text-red-900"
          : "bg-yellow-100 text-yellow-900"
      }`}
    >
      <Flame className="w-4 h-4" />
      <span className="font-medium">
        {Math.floor(status.hoursRemaining)}h left to maintain streak
      </span>
    </div>
  );
}
