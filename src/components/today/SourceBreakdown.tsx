interface Source {
  source: string;
  displayName: string;
  icon: string;
  count: number;
}

interface SourceBreakdownProps {
  sources: Source[];
}

/**
 * Format large numbers: 1234 → 1.2k, 1000000 → 1M
 */
function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

export function SourceBreakdown({ sources }: SourceBreakdownProps) {
  if (sources.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-500 mb-2">No items saved yet</p>
        <p className="text-xs text-gray-400">
          Start saving content to see your sources here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-96 overflow-y-auto">
      {sources.map((source) => (
        <div
          key={source.source}
          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-lg" aria-label={source.displayName}>
              {source.icon}
            </span>
            <span className="text-sm text-gray-700 truncate">
              {source.displayName}
            </span>
          </div>
          <span className="text-sm font-semibold text-gray-900 ml-2 flex-shrink-0">
            {formatCount(source.count)}
          </span>
        </div>
      ))}
    </div>
  );
}
