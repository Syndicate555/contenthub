"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Domain {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

interface FocusArea {
  id: string;
  priority: number;
  domain: Domain;
}

export default function FocusAreasSection() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch domains and current focus areas
  const fetchData = useCallback(async () => {
    setLoadError(null);
    try {
      const [domainsRes, focusAreasRes] = await Promise.all([
        fetch("/api/domains"),
        fetch("/api/user/focus-areas"),
      ]);

      const domainsData = await domainsRes.json();
      const focusAreasData = await focusAreasRes.json();

      if (domainsData.ok) {
        setDomains(domainsData.data.domains);
      } else {
        setLoadError(
          domainsData.error || "Failed to load focus area categories",
        );
      }

      if (focusAreasData.ok) {
        setFocusAreas(focusAreasData.data.focusAreas);
        // Set initial selected IDs from current focus areas
        setSelectedIds(
          focusAreasData.data.focusAreas.map((fa: FocusArea) => fa.domain.id),
        );
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLoadError("Network error: Unable to load focus area categories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleToggleDomain = (domainId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(domainId)) {
        // Remove
        return prev.filter((id) => id !== domainId);
      } else {
        // Add (max 3)
        if (prev.length >= 3) {
          setNotification({
            type: "error",
            message: "Maximum 3 focus areas allowed. Deselect one first.",
          });
          return prev;
        }
        return [...prev, domainId];
      }
    });
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setNotification({
        type: "error",
        message: "Please select at least 1 focus area",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/user/focus-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainIds: selectedIds }),
      });

      const data = await response.json();

      if (data.ok) {
        setFocusAreas(data.data.focusAreas);
        setNotification({
          type: "success",
          message: "Focus areas updated successfully!",
        });
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to save focus areas",
        });
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: "Failed to save focus areas",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Check if selection has changed from saved state
  const hasChanges =
    JSON.stringify(selectedIds.sort()) !==
    JSON.stringify(focusAreas.map((fa) => fa.domain.id).sort());

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Show error state if domains failed to load
  if (loadError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Focus Areas
          </h2>
        </div>
        <div className="flex items-center gap-2 p-4 rounded-lg text-sm bg-red-50 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Unable to load focus areas</p>
            <p className="text-xs mt-1">{loadError}</p>
          </div>
          <Button size="sm" onClick={fetchData} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Focus Areas
          </h2>
          <p className="text-sm text-gray-500">
            Select up to 3 domains to focus on. This helps personalize your
            quests and recommendations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {selectedIds.length}/3 selected
          </span>
          {hasChanges && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-1.5"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={cn(
            "flex items-center gap-2 p-3 rounded-lg text-sm",
            notification.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800",
          )}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Domain Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {domains.map((domain) => {
          const isSelected = selectedIds.includes(domain.id);
          const priority = selectedIds.indexOf(domain.id) + 1;

          return (
            <button
              key={domain.id}
              onClick={() => handleToggleDomain(domain.id)}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all text-left",
                isSelected
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300",
              )}
            >
              {/* Priority Badge */}
              {isSelected && (
                <div
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: domain.color || "#3b82f6" }}
                >
                  {priority}
                </div>
              )}

              {/* Icon */}
              <div className="text-2xl mb-2">{domain.icon}</div>

              {/* Name */}
              <div className="font-medium text-gray-900">
                {domain.displayName}
              </div>

              {/* Description (truncated) */}
              <div className="text-xs text-gray-500 line-clamp-2 mt-1">
                {domain.description}
              </div>
            </button>
          );
        })}
      </div>

      {/* Current Focus Areas (if saved) */}
      {focusAreas.length > 0 && !hasChanges && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Your Current Focus
          </h3>
          <div className="flex flex-wrap gap-2">
            {focusAreas.map((fa) => (
              <div
                key={fa.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: fa.domain.color || "#3b82f6" }}
              >
                <span>{fa.domain.icon}</span>
                <span>{fa.domain.displayName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
