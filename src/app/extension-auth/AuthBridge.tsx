"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

interface AuthBridgeProps {
  token: string;
  email: string;
}

export function AuthBridge({ token, email }: AuthBridgeProps) {
  const [status, setStatus] = useState<"sending" | "success" | "error">(
    "sending"
  );
  const [countdown, setCountdown] = useState(10);
  const [extensionId, setExtensionId] = useState<string | null>(null);

  useEffect(() => {
    const sendTokenToExtension = async () => {
      try {
        // Debug logging
        console.log("[Tavlo Auth] Current URL:", window.location.href);

        // Check if chrome API is available
        const chromeAvailable =
          typeof window !== "undefined" &&
          // @ts-expect-error - chrome is available via externally_connectable
          typeof window.chrome !== "undefined";
        const chromeRuntimeAvailable =
          chromeAvailable &&
          // @ts-expect-error - chrome.runtime is available via externally_connectable
          typeof window.chrome.runtime !== "undefined";

        console.log("[Tavlo Auth] Chrome available:", chromeAvailable);
        console.log(
          "[Tavlo Auth] Chrome runtime available:",
          chromeRuntimeAvailable
        );

        // Get extension ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const extId = urlParams.get("extensionId");

        console.log("[Tavlo Auth] Extension ID from URL:", extId);

        if (!extId) {
          console.error(
            "[Tavlo Auth] No extension ID in URL parameters. Full search params:",
            window.location.search
          );
          setStatus("error");
          return;
        }

        console.log(
          "[Tavlo Auth] Attempting to send token to extension:",
          extId
        );

        // Save extension ID for later use
        setExtensionId(extId);

        // Use Chrome extension messaging API
        if (chromeRuntimeAvailable) {
          // @ts-expect-error - chrome.runtime.sendMessage is available via externally_connectable
          window.chrome.runtime.sendMessage(
            extId,
            {
              type: "TAVLO_EXTENSION_AUTH",
              token,
              email,
            },
            (response: { success: boolean; error?: string }) => {
              // @ts-expect-error - chrome.runtime.lastError is available
              if (window.chrome.runtime.lastError) {
                console.error(
                  "[Tavlo Auth] Error sending message:",
                  // @ts-expect-error - chrome.runtime.lastError
                  window.chrome.runtime.lastError.message
                );
                console.error("[Tavlo Auth] Extension ID used:", extId);
                console.error(
                  "[Tavlo Auth] Current domain:",
                  window.location.origin
                );
                setStatus("error");
                return;
              }

              if (response?.success) {
                console.log(
                  "[Tavlo Auth] Token sent successfully to extension"
                );
                setStatus("success");
              } else {
                console.error(
                  "[Tavlo Auth] Extension rejected token:",
                  response?.error
                );
                setStatus("error");
              }
            }
          );
        } else {
          console.error(
            "[Tavlo Auth] Chrome runtime not available. This page must be accessed from Chrome/Edge with the extension installed."
          );
          setStatus("error");
        }
      } catch (error) {
        console.error("[Tavlo Auth] Unexpected error:", error);
        setStatus("error");
      }
    };

    sendTokenToExtension();
  }, [token, email]);

  // Countdown timer for auto-close
  useEffect(() => {
    if (status === "success" && extensionId) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);

            // Send message to extension to close this tab
            const chromeAvailable =
              typeof window !== "undefined" &&
              // @ts-expect-error - chrome is available via externally_connectable
              typeof window.chrome !== "undefined" &&
              // @ts-expect-error - chrome.runtime is available
              typeof window.chrome.runtime !== "undefined";

            if (chromeAvailable) {
              // @ts-expect-error - chrome.runtime.sendMessage
              window.chrome.runtime.sendMessage(
                extensionId,
                { type: "TAVLO_EXTENSION_CLOSE_TAB" },
                () => {
                  // Fallback: try window.close() in case it works
                  window.close();
                }
              );
            } else {
              // Fallback if chrome API not available
              window.close();
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status, extensionId]);

  if (status === "sending") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-300">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Authenticating...
          </h2>
          <p className="text-gray-600 font-medium">
            Securely connecting your account to the extension
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-300">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Authentication Error
          </h2>
          <p className="text-gray-600 mb-6 font-medium">
            Unable to send token to extension. Please close this window and try
            again.
          </p>
          <button
            onClick={() => window.close()}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center animate-[fadeIn_0.5s_ease-out]">
        {/* Success Icon */}
        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-300 animate-[bounceIn_0.6s_ease-out]">
          <CheckCircle2 className="w-14 h-14 text-white" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
          Authentication Successful!
        </h2>
        <p className="text-gray-600 mb-6 font-medium">
          Logged in as{" "}
          <span className="font-bold text-purple-600">{email}</span>
        </p>

        {/* Success Message */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5 mb-6">
          <p className="text-sm text-gray-700 font-medium mb-3">
            ✨ Your account has been connected to the extension!
          </p>
          <p className="text-xs text-gray-600">
            You can now save links to Tavlo with one click.
          </p>
        </div>

        {/* Auto-close countdown */}
        {countdown > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-600">
              This window will close automatically in{" "}
              <span className="font-bold text-purple-600">{countdown}</span>{" "}
              seconds
            </p>
          </div>
        )}

        {/* Manual close button */}
        <button
          onClick={() => window.close()}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-white rounded-2xl hover:shadow-2xl hover:shadow-purple-300 transition-all duration-300 font-bold hover:scale-105 transform"
        >
          Close Window
        </button>

        {/* Fallback instructions if window doesn't close */}
        <p className="text-xs text-gray-500 mt-4">
          If this window doesn&apos;t close, you can close it manually 💜
        </p>
      </div>
    </div>
  );
}
