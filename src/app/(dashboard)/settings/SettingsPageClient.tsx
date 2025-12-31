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
  Instagram,
  Linkedin,
  MessageCircle,
  Youtube,
  Mail,
  Globe2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import FocusAreasSection from "./FocusAreasSection";
import { useSettingsData } from "@/hooks/use-dashboard";
import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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
  instagram: {
    name: "Instagram",
    icon: <Instagram className="w-5 h-5" />,
    color: "bg-gradient-to-br from-pink-500 via-amber-400 to-purple-500",
    connectPath: "#",
    description: "Import your saved posts and reels",
  },
  linkedin: {
    name: "LinkedIn",
    icon: <Linkedin className="w-5 h-5" />,
    color: "bg-blue-600",
    connectPath: "#",
    description: "Import your saved posts",
  },
  reddit: {
    name: "Reddit",
    icon: <MessageCircle className="w-5 h-5" />,
    color: "bg-orange-500",
    connectPath: "#",
    description: "Import your saved posts",
  },
  youtube: {
    name: "YouTube",
    icon: <Youtube className="w-5 h-5" />,
    color: "bg-red-600",
    connectPath: "#",
    description: "Import your saved videos",
  },

  // future platforms here
};

interface SettingsPageClientProps {
  fallbackData?: any;
}

export default function SettingsPageClient({
  fallbackData,
}: SettingsPageClientProps) {
  const connectionsDisabled = true;

  const searchParams = useSearchParams();

  // Use SWR hook with optional server-rendered fallback data
  const {
    connections,
    hasData,
    isLoading,
    error,
    mutate: mutateSettings,
  } = useSettingsData(fallbackData);
  const { user } = useUser();

  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [feedbackTab, setFeedbackTab] = useState<"feedback" | "support">(
    "feedback"
  );
  const [feedbackForm, setFeedbackForm] = useState({
    type: "",
    area: "",
    severity: "",
    body: "",
    allowFollowUp: true,
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

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
    if (connectionsDisabled) {
      toast.info("Platform connections are coming soon.");
      return;
    }
    const platform = PLATFORMS[provider as keyof typeof PLATFORMS];
    if (platform) {
      window.location.href = platform.connectPath;
    }
  };

  const handleSync = async (provider: string) => {
    if (connectionsDisabled) {
      toast.info("Platform connections are coming soon.");
      return;
    }
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
    if (connectionsDisabled) {
      toast.info("Platform connections are coming soon.");
      return;
    }
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

  const submitFeedback = async () => {
    if (!feedbackForm.body.trim()) {
      toast.error("Please share some details before submitting.");
      return;
    }
    if (!feedbackForm.type.trim()) {
      toast.error("Pick a type so we can triage faster.");
      return;
    }
    const contactEmail = user?.primaryEmailAddress?.emailAddress || "";
    if (!contactEmail) {
      toast.error("Missing contact email. Please ensure you're signed in.");
      return;
    }

    setSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: feedbackTab,
          type: feedbackForm.type,
          area: feedbackForm.area || undefined,
          severity:
            feedbackTab === "support"
              ? feedbackForm.severity || "minor"
              : undefined,
          body: feedbackForm.body,
          allowFollowUp: feedbackForm.allowFollowUp,
          contactEmail,
          route:
            typeof window !== "undefined"
              ? window.location.pathname
              : undefined,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to submit");
      }
      toast.success("Thanks! Your submission was received.");
      setFeedbackForm({
        type: "",
        area: "",
        severity: "",
        body: "",
        allowFollowUp: true,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit feedback"
      );
    } finally {
      setSubmittingFeedback(false);
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
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your connected accounts and sync preferences
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={cn(
            "flex items-center gap-2 p-4 rounded-lg",
            notification.type === "success"
              ? "bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-300"
              : "bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300"
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
        <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800 rounded-lg p-4 space-y-2">
          <h3 className="font-medium text-blue-900 dark:text-blue-300">Sync Complete</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {syncResult.synced}
              </div>
              <div className="text-muted-foreground">Imported</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {syncResult.skipped}
              </div>
              <div className="text-muted-foreground">Skipped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {syncResult.failed}
              </div>
              <div className="text-muted-foreground">Failed</div>
            </div>
          </div>
        </div>
      )}

      {/* Connected Accounts Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Connected Accounts
        </h2>
        <p className="text-sm text-muted-foreground">
          Connect your social media accounts to automatically import your
          bookmarks and saved posts.
        </p>
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 px-3 py-2 text-sm">
          Platform connections are coming soon for beta. For now, add links manually via Add.
        </div>

        {/* Platform Cards */}
        <div className="space-y-3">
          {Object.entries(PLATFORMS).map(([provider, platform]) => {
            const connection = getConnection(provider);
            const isSyncing = syncingProvider === provider;

            return (
              <div
                key={provider}
                className="bg-card border border-border rounded-xl p-4 shadow-sm"
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
                      <h3 className="font-medium text-foreground">
                        {platform.name}
                      </h3>
                      {connection ? (
                        <p className="text-sm text-muted-foreground">
                          @{connection.providerHandle}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
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
                          disabled
                          className="gap-1.5 opacity-60 cursor-not-allowed"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Sync
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 opacity-60 cursor-not-allowed"
                        >
                          <Unlink className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        disabled
                        className="gap-1.5 opacity-60 cursor-not-allowed"
                      >
                        <Link2 className="w-4 h-4" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>

                {/* Connection Stats */}
                {connection && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center gap-6 text-sm text-muted-foreground">
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

      {/* Feedback & Support */}
      <div className="border-t border-border pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Feedback & Support
            </h3>
            <p className="text-sm text-muted-foreground">
              Tell us what to improve or report an issue. We read everything.
            </p>
          </div>
          <div className="inline-flex rounded-full bg-muted p-1">
            <button
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-full transition",
                feedbackTab === "feedback"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setFeedbackTab("feedback")}
            >
              Feedback
            </button>
            <button
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-full transition",
                feedbackTab === "support"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setFeedbackTab("support")}
            >
              Support
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Type
                </label>
                <select
                  className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                  value={feedbackForm.type}
                  onChange={(e) =>
                    setFeedbackForm((f) => ({ ...f, type: e.target.value }))
                  }
                >
                  <option value="">Select…</option>
                  {feedbackTab === "feedback" ? (
                    <>
                      <option value="feature">Feature idea</option>
                      <option value="ux">UX / usability</option>
                      <option value="polish">Polish / styling</option>
                      <option value="other">Other</option>
                    </>
                  ) : (
                    <>
                      <option value="bug">Bug</option>
                      <option value="access">Access / login</option>
                      <option value="data">Data issue</option>
                      <option value="performance">Performance</option>
                      <option value="other">Other</option>
                    </>
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Area
                </label>
                <select
                  className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                  value={feedbackForm.area}
                  onChange={(e) =>
                    setFeedbackForm((f) => ({ ...f, area: e.target.value }))
                  }
                >
                  <option value="">Select…</option>
                  <option value="inbox">Inbox</option>
                  <option value="library">Library</option>
                  <option value="add">Add flow</option>
                  <option value="integrations">Integrations</option>
                  <option value="profile">Profile / settings</option>
                  <option value="notifications">Notifications</option>
                  <option value="mobile">Mobile</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {feedbackTab === "support" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Severity
                  </label>
                  <select
                    className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                    value={feedbackForm.severity}
                    onChange={(e) =>
                      setFeedbackForm((f) => ({
                        ...f,
                        severity: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select…</option>
                    <option value="blocking">Blocking</option>
                    <option value="major">Major</option>
                    <option value="minor">Minor</option>
                  </select>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Follow-up
                </label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    id="followup"
                    type="checkbox"
                    checked={feedbackForm.allowFollowUp}
                    onChange={(e) =>
                      setFeedbackForm((f) => ({
                        ...f,
                        allowFollowUp: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-border text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="followup">I'm okay with follow-up</label>
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Details
              </label>
              <Textarea
                rows={4}
                placeholder={
                  feedbackTab === "feedback"
                    ? "Tell us the idea, why it matters, or what feels rough..."
                    : "What happened? Expected vs. actual. Any steps to reproduce?"
                }
                value={feedbackForm.body}
                onChange={(e) =>
                  setFeedbackForm((f) => ({ ...f, body: e.target.value }))
                }
                className="resize-none"
              />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={submitFeedback}
                disabled={submittingFeedback}
                className="min-w-[140px]"
              >
                {submittingFeedback ? "Sending..." : "Submit"}
              </Button>
              <p className="text-xs text-muted-foreground">
                We include route and device info to debug faster. No private
                data is sent.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              What helps most?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li>• Where were you in the app (Inbox, Library, Add)?</li>
              <li>• What did you expect vs. what happened?</li>
              <li>• Screenshots make bugs 10x easier.</li>
              <li>• Severity: blocking, major, or minor?</li>
              <li>• For ideas: the job-to-be-done or pain you're solving.</li>
            </ul>
            <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 p-3 text-xs text-indigo-800 dark:text-indigo-300">
              We read every submission. Early beta feedback directly shapes
              Tavlo.
            </div>
          </div>
        </div>
      </div>

      {/* Focus Areas Section */}
      <div className="border-t border-border pt-6">
        <FocusAreasSection />
      </div>

      {/* Info Box */}
      <div className="bg-muted border border-border rounded-lg p-4">
        <h3 className="font-medium text-foreground mb-2">How it works</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>1. Connect your social media account</li>
          <li>2. Click Sync to import your bookmarks</li>
          <li>3. New bookmarks appear in your Today feed</li>
          <li>4. Each bookmark is processed with AI summarization</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">
          Note: We only access your bookmarks/saved posts. We cannot post or
          modify anything on your account.
        </p>
      </div>
    </div>
  );
}
