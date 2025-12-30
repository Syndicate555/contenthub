import { getWebAppUrl } from "../../shared/config";
import type { Badge } from "../../shared/types";

interface SuccessScreenProps {
  onSaveAnother: () => void;
  badges?: Badge[];
}

export default function SuccessScreen({
  onSaveAnother,
  badges,
}: SuccessScreenProps) {
  const handleViewInTavlo = () => {
    // Open Tavlo in new tab
    chrome.tabs.create({
      url: `${getWebAppUrl()}/today`,
    });
  };

  return (
    <div className="w-full h-full p-6 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Success Animation */}
      <div className="mb-8 animate-[fadeIn_0.5s_ease-out]">
        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-green-300 animate-[bounceIn_0.6s_ease-out]">
          <svg
            className="w-14 h-14 text-white animate-[checkmark_0.5s_ease-out_0.3s_both]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
          Saved Successfully!
        </h2>
        <p className="text-sm text-gray-600 text-center font-medium">
          Your link has been added to Tavlo ✨
        </p>
      </div>

      {/* Badges Section (if earned) */}
      {badges && badges.length > 0 ? (
        <div className="w-full mb-6 animate-[fadeIn_0.7s_ease-out]">
          <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl animate-[spin_1s_ease-in-out]">🎉</span>
              <h3 className="font-bold text-purple-700 text-lg">
                {badges.length === 1
                  ? "New Badge Unlocked!"
                  : `${badges.length} New Badges Unlocked!`}
              </h3>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {badges.map((badge, index) => (
                <div
                  key={badge.id}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border-2 border-purple-300 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 transform"
                  style={{
                    animation: `fadeIn 0.5s ease-out ${0.8 + index * 0.1}s both`,
                  }}
                >
                  <span className="text-xl">{badge.icon}</span>
                  <span className="text-sm font-bold text-gray-700">
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full mb-6 animate-[fadeIn_0.7s_ease-out]">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-sm text-gray-700 font-medium">
              🎯 Keep saving to unlock badges!
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full space-y-3 animate-[fadeIn_0.8s_ease-out]">
        <button
          onClick={onSaveAnother}
          className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-white rounded-2xl hover:shadow-2xl hover:shadow-purple-300 transition-all duration-300 font-bold text-base hover:scale-105 transform"
        >
          <span className="flex items-center justify-center gap-2">
            Save Another
            <span>🔖</span>
          </span>
        </button>

        <button
          onClick={handleViewInTavlo}
          className="w-full px-6 py-4 bg-white border-2 border-purple-200 text-purple-600 rounded-2xl hover:bg-purple-50 transition-all duration-200 font-bold hover:scale-105 transform shadow-sm hover:shadow-md"
        >
          <span className="flex items-center justify-center gap-2">
            View in Tavlo
            <span>👀</span>
          </span>
        </button>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-500 text-center mt-6 font-medium animate-[fadeIn_0.9s_ease-out]">
        You can close this popup anytime 💜
      </p>
    </div>
  );
}
