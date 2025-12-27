"use client";

import { useState, useEffect } from "react";

export default function DevToolsClient() {
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    // Check if impersonation cookie exists
    const hasImpersonationCookie = document.cookie.includes(
      "demo_impersonation_token",
    );
    setIsImpersonating(hasImpersonationCookie);
  }, []);

  async function handleImpersonate() {
    setIsLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/dev/impersonate-demo", {
        method: "POST",
      });

      const data = await response.json();

      if (data.ok) {
        setStatus("✅ Success! Refreshing page...");
        setIsImpersonating(true);
        setTimeout(() => {
          window.location.href = "/today";
        }, 1000);
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setStatus(`❌ Failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStopImpersonation() {
    setIsLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/dev/clear-impersonation", {
        method: "POST",
      });

      const data = await response.json();

      if (data.ok) {
        setStatus("✅ Stopped impersonation! Refreshing page...");
        setIsImpersonating(false);
        setTimeout(() => {
          window.location.href = "/today";
        }, 1000);
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setStatus(`❌ Failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl p-8">
      {isImpersonating && (
        <div className="mb-4 rounded-lg border-2 border-red-500 bg-red-50 p-4 dark:bg-red-950">
          <h2 className="mb-2 text-lg font-bold text-red-800 dark:text-red-200">
            ⚠️ Currently Impersonating Demo User
          </h2>
          <p className="mb-2 text-sm text-red-700 dark:text-red-300">
            You are seeing demo user content, not your own! Click "Stop
            Impersonation" below to return to your account.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-6 dark:bg-yellow-950">
        <h1 className="mb-2 text-2xl font-bold">🛠️ Dev Tools</h1>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Development only - Not available in production
        </p>

        <div className="space-y-4">
          <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-2 font-semibold">Demo User Impersonation</h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Impersonate the demo user to add content through the normal UI.
              This allows you to populate the demo account with high-quality
              production data.
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleImpersonate}
                disabled={isLoading}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Start Impersonation"}
              </button>

              <button
                onClick={handleStopImpersonation}
                disabled={isLoading}
                className="rounded border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                Stop Impersonation
              </button>
            </div>

            {status && (
              <div className="mt-4 rounded-md bg-gray-100 p-3 text-sm dark:bg-gray-800">
                {status}
              </div>
            )}
          </div>

          <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-2 text-sm font-semibold">Instructions:</h3>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>1. Click "Start Impersonation"</li>
              <li>2. You'll be redirected to /today as the demo user</li>
              <li>3. Add items normally through the UI</li>
              <li>
                4. All content you add will belong to the demo user account
              </li>
              <li>5. Click "Stop Impersonation" when done</li>
            </ol>
          </div>

          <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <h3 className="mb-2 text-sm font-semibold text-red-800 dark:text-red-200">
              ⚠️ Important Notes:
            </h3>
            <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
              <li>• Only works in development mode</li>
              <li>• Automatically disabled in production</li>
              <li>• Write protection is bypassed when impersonating</li>
              <li>• Use this to curate high-quality demo content</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
