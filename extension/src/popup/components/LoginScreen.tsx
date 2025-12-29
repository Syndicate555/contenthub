import React, { useState } from "react";
import { setToken } from "../../shared/storage";
import { validateToken } from "../../shared/api";
import { getWebAppUrl } from "../../shared/config";

interface LoginScreenProps {
  onLoginSuccess: (token: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenAuthPage = () => {
    // Open the extension-auth page in a new tab
    chrome.tabs.create({
      url: `${getWebAppUrl()}/extension-auth`,
    });
  };

  const handleValidateToken = async () => {
    if (!tokenInput.trim()) {
      setError("Please enter a token");
      return;
    }

    setError(null);
    setIsValidating(true);

    try {
      // Validate token with backend
      const isValid = await validateToken(tokenInput.trim());

      if (isValid) {
        // Store token
        await setToken(tokenInput.trim());
        // Notify parent of success
        onLoginSuccess(tokenInput.trim());
      } else {
        setError("Invalid or expired token. Please try again.");
      }
    } catch (error) {
      console.error("Token validation error:", error);
      setError("Failed to validate token. Please check your connection.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="w-full h-full p-6 flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="mb-6 text-center">
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-brand-1 to-brand-2 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-brand-1/25 mx-auto mb-3">
          T
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          Welcome to Tavlo
        </h1>
        <p className="text-sm text-text-secondary">
          Sign in to start saving links
        </p>
      </div>

      {/* Instructions */}
      <div className="w-full mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-text-body mb-2">
            <strong>Step 1:</strong> Click below to get your authentication
            token
          </p>
          <button
            onClick={handleOpenAuthPage}
            className="w-full px-4 py-2 bg-white border border-blue-300 text-brand-1 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            Open Tavlo Auth Page
          </button>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-text-body mb-3">
            <strong>Step 2:</strong> Paste your token below
          </p>
          <textarea
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste your authentication token here..."
            className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg resize-none text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-1 focus:border-transparent"
          />

          {error && (
            <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
              <span>⚠️</span> {error}
            </p>
          )}

          <button
            onClick={handleValidateToken}
            disabled={isValidating || !tokenInput.trim()}
            className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-brand-1 to-brand-2 text-white rounded-lg hover:shadow-lg hover:shadow-brand-1/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isValidating ? "Validating..." : "Validate & Save"}
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-text-secondary text-center">
        First time? You&apos;ll need to sign in to Tavlo first
      </p>
    </div>
  );
}
