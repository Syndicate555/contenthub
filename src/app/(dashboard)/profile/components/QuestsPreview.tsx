import { Target } from "lucide-react";

export function QuestsPreview() {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-dashed border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-purple-600" />
        <h2 className="text-lg font-semibold text-purple-900">Daily Quests</h2>
      </div>

      <div className="space-y-3 mb-4">
        {/* Mock Quest 1 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-purple-100">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                Process 5 Items
              </div>
              <div className="text-xs text-gray-600 mt-1">0 / 5 complete</div>
            </div>
            <div className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
              +25 XP
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full"
              style={{ width: "0%" }}
            ></div>
          </div>
        </div>

        {/* Mock Quest 2 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-purple-100">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                Add a Reflection
              </div>
              <div className="text-xs text-gray-600 mt-1">0 / 1 complete</div>
            </div>
            <div className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
              +15 XP
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full"
              style={{ width: "0%" }}
            ></div>
          </div>
        </div>

        {/* Mock Quest 3 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-purple-100">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                Focus Area Item
              </div>
              <div className="text-xs text-gray-600 mt-1">0 / 1 complete</div>
            </div>
            <div className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
              +10 XP
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full"
              style={{ width: "0%" }}
            ></div>
          </div>
        </div>
      </div>

      {/* Coming Soon Badge */}
      <div className="text-center pt-3 border-t border-purple-200">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
          <span className="animate-pulse">🚀</span>
          <span>Coming in Phase 3</span>
        </div>
        <p className="text-xs text-purple-600 mt-2">
          Quest system will be available soon!
        </p>
      </div>
    </div>
  );
}
