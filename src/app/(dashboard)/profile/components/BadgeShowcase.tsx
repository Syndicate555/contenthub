import { formatDistanceToNow } from "date-fns";

interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  awardedAt: string;
}

interface BadgeShowcaseProps {
  badges: Badge[];
}

const RARITY_COLORS: Record<string, string> = {
  common: "border-gray-300 bg-gray-50",
  rare: "border-blue-400 bg-blue-50",
  epic: "border-purple-400 bg-purple-50",
  legendary: "border-yellow-400 bg-yellow-50",
};

const RARITY_TEXT: Record<string, string> = {
  common: "text-gray-700",
  rare: "text-blue-700",
  epic: "text-purple-700",
  legendary: "text-yellow-700",
};

export function BadgeShowcase({ badges }: BadgeShowcaseProps) {
  if (badges.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Badges</h2>
          <span className="text-sm text-gray-500">0 / 14</span>
        </div>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-sm">No badges earned yet</p>
          <p className="text-xs mt-1">Complete challenges to unlock badges!</p>
        </div>
      </div>
    );
  }

  // Sort by rarity and then by date (newest first)
  const sortedBadges = [...badges].sort((a, b) => {
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    const rarityDiff =
      (rarityOrder[a.rarity as keyof typeof rarityOrder] || 99) -
      (rarityOrder[b.rarity as keyof typeof rarityOrder] || 99);

    if (rarityDiff !== 0) return rarityDiff;
    return new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime();
  });

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Badges</h2>
        <span className="text-sm text-gray-500">
          {badges.length} / 14
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sortedBadges.map((badge) => (
          <div
            key={badge.id}
            className={`group relative rounded-lg p-4 border-2 transition-all hover:scale-105 hover:shadow-md cursor-pointer ${
              RARITY_COLORS[badge.rarity] || RARITY_COLORS.common
            }`}
            title={`${badge.name} - ${badge.description}`}
          >
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
            <div className="text-center text-xs text-gray-600 mt-1 capitalize">
              {badge.rarity}
            </div>

            {/* Earned Date (tooltip) */}
            <div className="absolute inset-x-0 -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity text-center text-xs text-gray-500">
              {formatDistanceToNow(new Date(badge.awardedAt), {
                addSuffix: true,
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Message */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-600">
          {badges.length < 14
            ? `${14 - badges.length} more badge${14 - badges.length !== 1 ? "s" : ""} to unlock!`
            : "All badges unlocked! 🎉"}
        </p>
      </div>
    </div>
  );
}
