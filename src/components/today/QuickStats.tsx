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
      icon: <Bookmark className="w-4 h-4" />,
      label: "Saved",
      value: itemsSaved,
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: <CheckCircle className="w-4 h-4" />,
      label: "Processed",
      value: itemsProcessed,
      color: "bg-green-50 text-green-600",
    },
    {
      icon: <Flame className="w-4 h-4" />,
      label: "Streak",
      value: currentStreak,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className={`p-1.5 rounded ${stat.color} mb-1`}>{stat.icon}</div>
          <div className="text-base font-bold text-gray-900">{stat.value}</div>
          <div className="text-[10px] text-gray-600 text-center">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
