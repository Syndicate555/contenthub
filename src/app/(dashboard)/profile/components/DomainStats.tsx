interface UserDomain {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  totalXp: number;
  level: number;
  itemCount: number;
  levelProgress: {
    currentLevel: number;
    nextLevelXp: number;
    xpNeeded: number;
    progress: number;
  };
}

interface DomainStatsProps {
  domains: UserDomain[];
}

export function DomainStats({ domains }: DomainStatsProps) {
  // Sort by XP (highest first)
  const sortedDomains = [...domains].sort((a, b) => b.totalXp - a.totalXp);

  if (domains.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Domain Progress</h2>
        <div className="text-center py-8 text-gray-500">
          <p>Start processing items to see your domain progress!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Domain Progress</h2>

      <div className="space-y-4">
        {sortedDomains.map((userDomain, index) => (
          <div
            key={userDomain.id}
            className="group hover:bg-gray-50 rounded-lg p-4 transition-colors border border-gray-100"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="text-3xl flex items-center justify-center w-12 h-12 rounded-lg"
                  style={{
                    backgroundColor: `${userDomain.color}15`,
                  }}
                >
                  {userDomain.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {userDomain.displayName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {userDomain.itemCount} {userDomain.itemCount === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-lg font-bold"
                  style={{ color: userDomain.color }}
                >
                  Level {userDomain.level}
                </div>
                <div className="text-xs text-gray-500">
                  {userDomain.totalXp} XP
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>
                  {userDomain.levelProgress.xpNeeded} XP to next level
                </span>
                <span>{userDomain.levelProgress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${userDomain.levelProgress.progress}%`,
                    backgroundColor: userDomain.color,
                  }}
                ></div>
              </div>
            </div>

            {/* Rank indicator for top 3 */}
            {index === 0 && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                <span>🏆</span>
                <span>Top Domain</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
