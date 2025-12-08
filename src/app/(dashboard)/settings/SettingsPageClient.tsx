"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings,
  Link2,
  RefreshCw,
  Unlink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import FocusAreasSection from "./FocusAreasSection";
import { useSettingsData } from "@/hooks/use-dashboard";

interface Connection {
  id: string;
  provider: string;
  providerHandle: string | null;
  syncEnabled: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  importedCount: number;
}

interface SyncResult {
  success: boolean;
  synced: number;
  skipped: number;
  failed: number;
  errors: string[];
}

// Platform configuration
const PLATFORMS = {
  twitter: {
    name: "Twitter / X",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    color: "bg-black",
    connectPath: "/api/auth/twitter",
    description: "Import your bookmarked tweets",
  },
  pinterest: {
    name: "Pinterest",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
      </svg>
    ),
    color: "bg-red-600",
    connectPath: "/api/auth/pinterest",
    description: "Import your saved pins",
  },
  // future platforms here
};

interface SettingsPageClientProps {
  fallbackData?: any;
}

export default function SettingsPageClient({ fallbackData }: SettingsPageClientProps) {
  const searchParams = useSearchParams();

  // Use SWR hook with optional server-rendered fallback data
  const {
    connections,
    hasData,
    isLoading,
    error,
    mutate: mutateSettings,
  } = useSettingsData(fallbackData);

  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Handle URL params for OAuth callbacks
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const handle = searchParams.get("handle");
    const message = searchParams.get("message");

    if (success === "twitter_connected") {
      setNotification({
        type: "success",
        message: handle
          ? `Successfully connected @${handle}`
          : "Twitter connected successfully",
      });
      window.history.replaceState({}, "", "/settings");
    } else if (success === "pinterest_connected") {
      setNotification({
        type: "success",
        message: handle
          ? `Successfully connected @${handle}`
          : "Pinterest connected successfully",
      });
      window.history.replaceState({}, "", "/settings");
    } else if (error) {
      setNotification({
        type: "error",
        message: message || `Connection failed: ${error}`,
      });
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleConnect = (provider: string) => {
    const platform = PLATFORMS[provider as keyof typeof PLATFORMS];
    if (platform) {
      window.location.href = platform.connectPath;
    }
  };

  const handleSync = async (provider: string) => {
    setSyncingProvider(provider);
    setSyncResult(null);

    try {
      const response = await fetch(`/api/connections/${provider}`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.ok) {
        setSyncResult(data.data);
        mutateSettings();
      } else {
        setNotification({
          type: "error",
          message: data.error || "Sync failed",
        });
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: "Failed to sync bookmarks",
      });
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (
      !confirm(
        `Are you sure you want to disconnect ${
          PLATFORMS[provider as keyof typeof PLATFORMS]?.name
        }?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/connections/${provider}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.ok) {
        setNotification({
          type: "success",
          message: "Account disconnected successfully",
        });
        mutateSettings();
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to disconnect",
        });
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: "Failed to disconnect account",
      });
    }
  };

  const getConnection = (provider: string) =>
    connections.find((c: Connection) => c.provider === provider);

  const formatLastSync = (date: string | null) => {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (isLoading && !hasData) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => mutateSettings()}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Settings
        </h1>
        <p className="text-sm text-gray-500">
          Manage your connected accounts and sync preferences
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={cn(
            "flex items-center gap-2 p-4 rounded-lg",
            notification.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          )}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Sync Result */}
      {syncResult && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2">
          <h3 className="font-medium text-blue-900">Sync Complete</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {syncResult.synced}
              </div>
              <div className="text-gray-600">Imported</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {syncResult.skipped}
              </div>
              <div className="text-gray-600">Skipped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {syncResult.failed}
              </div>
              <div className="text-gray-600">Failed</div>
            </div>
          </div>
        </div>
      )}

      {/* Connected Accounts Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Connected Accounts
        </h2>
        <p className="text-sm text-gray-500">
          Connect your social media accounts to automatically import your
          bookmarks and saved posts.
        </p>

        {/* Platform Cards */}
        <div className="space-y-3">
          {Object.entries(PLATFORMS).map(([provider, platform]) => {
            const connection = getConnection(provider);
            const isSyncing = syncingProvider === provider;

            return (
              <div
                key={provider}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  {/* Platform Info */}
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-white",
                        platform.color
                      )}
                    >
                      {platform.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {platform.name}
                      </h3>
                      {connection ? (
                        <p className="text-sm text-gray-500">
                          @{connection.providerHandle}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">
                          {platform.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {connection ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(provider)}
                          disabled={isSyncing}
                          className="gap-1.5"
                        >
                          <RefreshCw
                            className={cn(
                              "w-4 h-4",
                              isSyncing && "animate-spin"
                            )}
                          />
                          {isSyncing ? "Syncing..." : "Sync"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnect(provider)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Unlink className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(provider)}
                        className="gap-1.5"
                      >
                        <Link2 className="w-4 h-4" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>

                {/* Connection Stats */}
                {connection && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Download className="w-4 h-4" />
                      <span>{connection.importedCount} imported</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>
                        Last sync: {formatLastSync(connection.lastSyncAt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Focus Areas Section */}
      <div className="border-t border-gray-200 pt-6">
        <FocusAreasSection />
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">How it works</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>1. Connect your social media account</li>
          <li>2. Click Sync to import your bookmarks</li>
          <li>3. New bookmarks appear in your Today feed</li>
          <li>4. Each bookmark is processed with AI summarization</li>
        </ul>
        <p className="text-xs text-gray-400 mt-3">
          Note: We only access your bookmarks/saved posts. We cannot post or
          modify anything on your account.
        </p>
      </div>
    </div>
  );
}
