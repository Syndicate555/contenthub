"use client";

import { motion } from "framer-motion";
import { Bookmark, CheckCircle, Flame } from "lucide-react";
import { fadeInScale } from "@/lib/animations";

interface QuickStatsProps {
  itemsSaved: number;
  itemsProcessed: number;
  currentStreak: number;
}

export function QuickStats({
  itemsSaved,
  itemsProcessed,
  currentStreak,
}: QuickStatsProps) {
  const stats = [
    {
      icon: Bookmark,
      label: "Saved",
      value: itemsSaved,
      gradient: "from-blue-500 to-indigo-600",
      shadowColor: "shadow-blue-500/20",
      iconBg: "bg-blue-500",
    },
    {
      icon: CheckCircle,
      label: "Processed",
      value: itemsProcessed,
      gradient: "from-green-500 to-emerald-600",
      shadowColor: "shadow-green-500/20",
      iconBg: "bg-green-500",
    },
    {
      icon: Flame,
      label: "Streak",
      value: currentStreak,
      gradient: "from-orange-500 to-red-600",
      shadowColor: "shadow-orange-500/20",
      iconBg: "bg-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          variants={fadeInScale}
          initial="initial"
          animate="animate"
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={`relative flex flex-col items-center p-2 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.shadowColor} overflow-hidden cursor-pointer`}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "10px 10px",
              }}
            />
          </div>

          {/* Icon */}
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <stat.icon className="w-4 h-4 text-white mb-0.5" />
          </motion.div>

          {/* Value with animation */}
          <motion.div
            key={stat.value}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-xl font-bold text-white drop-shadow relative z-10"
          >
            {stat.value}
          </motion.div>

          {/* Label */}
          <div className="text-[9px] font-semibold text-white/90 uppercase tracking-wide relative z-10">
            {stat.label}
          </div>

          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 2 + index,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
