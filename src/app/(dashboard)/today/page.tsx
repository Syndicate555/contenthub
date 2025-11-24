"use client";

import { useEffect, useState, useCallback } from "react";
import { ItemCard } from "@/components/items/item-card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Inbox, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Item } from "@/generated/prisma";
import { cn } from "@/lib/utils";

export default function TodayPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processedToday, setProcessedToday] = useState(0);

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch("/api/items?status=new&limit=20");
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to fetch items");
      }

      setItems(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleStatusChange = (id: string) => {
    // Optimistically remove the item from the list with animation
    setItems((prev) => prev.filter((item) => item.id !== id));
    setProcessedToday((prev) => prev + 1);
  };

  // Get current date formatted
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setIsLoading(true);
            fetchItems();
          }}
          className="text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Today</h1>
          {processedToday > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              <span>{processedToday} processed</span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500">{today}</p>
      </div>

      {/* Stats Banner */}
      {items.length > 0 && (
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-white/70">Items to review</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/70">Take action on each item</p>
              <p className="text-sm">Pin, Archive, or Delete</p>
            </div>
          </div>
        </div>
      )}

      {/* Items Feed */}
      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            All caught up!
          </h2>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            You have no new items to review. Your inbox is empty and ready for new content.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/add"
              className="inline-flex items-center px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Add Content
            </Link>
            <Link
              href="/items"
              className="inline-flex items-center px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Browse Library
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Feed intro */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span>Review your saved content and decide what to keep</span>
          </div>

          {/* Item Cards */}
          {items.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "transform transition-all duration-300",
                "animate-in fade-in slide-in-from-bottom-2"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ItemCard
                item={item}
                showActions={true}
                onStatusChange={handleStatusChange}
              />
            </div>
          ))}

          {/* End of feed */}
          <div className="text-center py-8 text-gray-400 text-sm">
            End of your feed for today
          </div>
        </div>
      )}
    </div>
  );
}
