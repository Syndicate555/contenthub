"use client";

import { useUser } from "@clerk/nextjs";
import Image from "next/image";

interface UserProfileSectionProps {
  level: number;
  totalXp: number;
  levelProgress: {
    currentLevel: number;
    nextLevelXp: number;
    xpNeeded: number;
    progress: number;
  };
}

export function UserProfileSection({
  level,
  totalXp,
  levelProgress,
}: UserProfileSectionProps) {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center space-y-3 animate-pulse">
        <div className="w-16 h-16 rounded-full bg-gray-200" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-3 w-16 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Avatar */}
      <div className="relative">
        <Image
          src={user.imageUrl}
          alt={user.fullName || user.username || "User"}
          width={64}
          height={64}
          className="rounded-full border-2 border-gray-200"
        />
      </div>

      {/* User Name */}
      <div className="text-center">
        <h3 className="text-sm font-semibold text-gray-900 truncate max-w-60">
          {user.fullName || user.username || "User"}
        </h3>
      </div>

      {/* Level Badge */}
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-gray-900 text-white text-xs font-semibold rounded-full">
          Level {level}
        </span>
      </div>

      {/* XP Progress */}
      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">XP Progress</span>
          <span className="text-gray-900 font-semibold">
            {totalXp.toLocaleString()} XP
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gray-900 h-2 rounded-full transition-all duration-300"
            style={{ width: `${levelProgress.progress}%` }}
          />
        </div>

        <div className="text-[10px] text-gray-500 text-center">
          {levelProgress.xpNeeded.toLocaleString()} XP to Level {level + 1}
        </div>
      </div>
    </div>
  );
}
