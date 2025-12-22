"use client";

import { Bookmark, CheckCircle, Flame } from "lucide-react";

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
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`relative flex flex-col items-center p-2 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-sm ${stat.shadowColor} overflow-hidden`}
        >
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
          <div className="relative z-10 flex flex-col items-center">
            <stat.icon className="w-4 h-4 text-white mb-0.5" />
            <div className="text-xl font-bold text-white drop-shadow relative z-10">
              {stat.value}
            </div>
            <div className="text-[9px] font-semibold text-white/90 uppercase tracking-wide relative z-10">
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
