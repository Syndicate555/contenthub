import { formatDistanceToNow } from "date-fns";

interface XPEvent {
  id: string;
  action: string;
  xpAmount: number;
  createdAt: string;
  domain?: {
    displayName: string;
    icon: string;
    color: string;
  };
}

interface RecentActivityProps {
  events: XPEvent[];
}

const ACTION_LABELS: Record<string, string> = {
  save_item: "Saved Item",
  process_item: "Processed Item",
  add_reflection: "Added Reflection",
  complete_daily_quest: "Completed Daily Quest",
  complete_weekly_quest: "Completed Weekly Quest",
  maintain_streak: "Maintained Streak",
  first_item_of_day: "First Item Today",
  focus_area_bonus: "Focus Area Bonus",
};

const ACTION_COLORS: Record<string, string> = {
  save_item: "text-blue-600 bg-blue-50",
  process_item: "text-green-600 bg-green-50",
  add_reflection: "text-purple-600 bg-purple-50",
  complete_daily_quest: "text-orange-600 bg-orange-50",
  complete_weekly_quest: "text-red-600 bg-red-50",
  maintain_streak: "text-yellow-600 bg-yellow-50",
  first_item_of_day: "text-cyan-600 bg-cyan-50",
  focus_area_bonus: "text-pink-600 bg-pink-50",
};

export function RecentActivity({ events }: RecentActivityProps) {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No recent activity yet</p>
          <p className="text-xs mt-1">Process your first item to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>

      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* XP Badge */}
            <div
              className={`flex-shrink-0 px-2 py-1 rounded-md font-semibold text-sm ${
                ACTION_COLORS[event.action] || "text-gray-600 bg-gray-50"
              }`}
            >
              +{event.xpAmount}
            </div>

            {/* Event Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-900">
                  {ACTION_LABELS[event.action] || event.action}
                </span>
                {event.domain && (
                  <div className="flex items-center gap-1 text-xs">
                    <span>{event.domain.icon}</span>
                    <span
                      className="font-medium"
                      style={{ color: event.domain.color }}
                    >
                      {event.domain.displayName}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {formatDistanceToNow(new Date(event.createdAt), {
                  addSuffix: true,
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View More Link */}
      {events.length >= 10 && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <button className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
            View All Activity →
          </button>
        </div>
      )}
    </div>
  );
}
