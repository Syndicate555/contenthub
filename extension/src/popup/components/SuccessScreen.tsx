import React from "react";
import { getWebAppUrl } from "../../shared/config";

interface SuccessScreenProps {
  onSaveAnother: () => void;
}

export default function SuccessScreen({ onSaveAnother }: SuccessScreenProps) {
  const handleViewInTavlo = () => {
    // Open Tavlo in new tab
    chrome.tabs.create({
      url: `${getWebAppUrl()}/today`,
    });
  };

  return (
    <div className="w-full h-full p-6 flex flex-col items-center justify-center">
      {/* Success Animation */}
      <div className="mb-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <svg
            className="w-12 h-12 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-center text-text-primary mb-2">
          Saved Successfully!
        </h2>
        <p className="text-sm text-text-secondary text-center">
          Your link has been added to Tavlo
        </p>
      </div>

      {/* Badges Section (if earned) */}
      <div className="w-full mb-6">
        {/* TODO: Display earned badges when available */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 text-center">
          <p className="text-sm text-text-body">
            🎯 Keep saving to unlock badges!
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full space-y-3">
        <button
          onClick={onSaveAnother}
          className="w-full px-4 py-3 bg-gradient-to-r from-brand-1 to-brand-2 text-white rounded-lg hover:shadow-lg hover:shadow-brand-1/20 transition-all font-medium"
        >
          Save Another
        </button>

        <button
          onClick={handleViewInTavlo}
          className="w-full px-4 py-3 bg-white border border-gray-300 text-text-primary rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          View in Tavlo
        </button>
      </div>

      {/* Footer */}
      <p className="text-xs text-text-secondary text-center mt-6">
        You can close this popup anytime
      </p>
    </div>
  );
}
