"use client";

import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

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
        <div className="w-20 h-20 rounded-full bg-muted" />
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-3 w-16 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted rounded-lg" />

      <div className="relative flex flex-col items-center space-y-3 p-3">
        {/* Avatar with subtle border */}
        <div className="relative">
          <div className="relative">
            <Image
              src={user.imageUrl}
              alt={user.fullName || user.username || "User"}
              width={64}
              height={64}
              className="rounded-full border-3 border-card shadow-lg ring-2 ring-border"
            />
          </div>
        </div>

        {/* User Name */}
        <div className="text-center">
          <h3 className="text-sm font-bold text-foreground truncate max-w-60">
            {user.fullName || user.username || "User"}
          </h3>
        </div>

        {/* Level Badge with gold gradient */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-3 py-1.5 bg-gradient-xp rounded-full shadow-md"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-bold text-white">Level {level}</span>
          </div>
        </motion.div>

        {/* XP Progress */}
        <div className="w-full space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground font-medium">XP Progress</span>
            <motion.span
              key={totalXp}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-foreground font-bold"
            >
              {totalXp.toLocaleString()} XP
            </motion.span>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden shadow-inner">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress.progress}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            />
          </div>

          <div className="text-[10px] text-muted-foreground text-center font-medium">
            {levelProgress.xpNeeded.toLocaleString()} XP to Level {level + 1}
          </div>
        </div>
      </div>
    </div>
  );
}
