import { useState, useEffect } from "react";
import { validateToken } from "../../shared/api";
import { getWebAppUrl } from "../../shared/config";

interface LoginScreenProps {
  onLoginSuccess: (token: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for storage changes (when background worker saves the token)
  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      // Check if auth token was added
      if (areaName === "sync" && changes.tavlo_auth_token) {
        const newToken = changes.tavlo_auth_token.newValue;

        if (newToken) {
          setIsAuthenticating(false);

          validateToken(newToken)
            .then((isValid) => {
              if (isValid) {
                onLoginSuccess(newToken);
              } else {
                setError("Invalid or expired token. Please try again.");
                setIsAuthenticating(false);
              }
            })
            .catch((error) => {
              console.error("[Tavlo Extension] Token validation error:", error);
              setError(
                "Failed to validate token. Please check your connection.",
              );
              setIsAuthenticating(false);
            });
        }
      }
    };

    // Listen for storage changes
    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [onLoginSuccess]);

  const handleOpenAuthPage = async () => {
    setError(null);
    setIsAuthenticating(true);

    try {
      const extensionId = chrome.runtime.id;
      const authUrl = `${getWebAppUrl()}/extension-auth?extensionId=${extensionId}`;

      chrome.tabs.create({
        url: authUrl,
        active: true,
      });
    } catch (error) {
      console.error("[Tavlo Extension] Error opening auth page:", error);
      setError("Failed to open authentication page. Please try again.");
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="w-full h-full p-6 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Logo */}
      <div className="mb-8 text-center animate-[fadeIn_0.5s_ease-out]">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold shadow-2xl shadow-purple-300 mx-auto mb-4 transform hover:scale-110 transition-transform duration-300">
          T
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Welcome to Tavlo
        </h1>
        <p className="text-sm text-gray-600 font-medium">
          One-click saving for the web ✨
        </p>
      </div>

      {/* Auth Instructions */}
      <div className="w-full mb-6 animate-[fadeIn_0.6s_ease-out]">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl">🔐</span>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800 mb-2">
                Sign in to get started
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                Click below to authenticate with your Tavlo account. You&apos;ll
                be redirected to a secure login page.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAuthPage}
            disabled={isAuthenticating}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-white rounded-2xl hover:shadow-2xl hover:shadow-purple-300 transition-all duration-300 font-bold text-base hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isAuthenticating ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                Waiting for authentication...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Login with Tavlo
                <span>🚀</span>
              </span>
            )}
          </button>

          {isAuthenticating && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl animate-[fadeIn_0.3s_ease-out]">
              <p className="text-xs text-blue-700 font-medium text-center">
                💡 Complete the login in the new tab, then return here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="w-full mb-6 animate-[shake_0.5s_ease-in-out]">
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl p-4">
            <p className="text-red-600 text-sm flex items-center gap-2 font-medium">
              <span className="text-lg">⚠️</span> {error}
            </p>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="w-full animate-[fadeIn_0.7s_ease-out]">
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>✨</span> What you&apos;ll get:
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-purple-500 font-bold">•</span>
              <span>Save links from any website with one click</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <span>Automatic platform detection (Twitter, Reddit, etc.)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold">•</span>
              <span>Earn badges and track your reading habits</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-500 text-center mt-6 font-medium animate-[fadeIn_0.8s_ease-out]">
        First time? You&apos;ll be prompted to create an account 💜
      </p>
    </div>
  );
}
