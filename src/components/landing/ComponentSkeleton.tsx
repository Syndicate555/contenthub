import React from "react";

interface ComponentSkeletonProps {
  variant?: "section" | "video" | "cards" | "footer";
  minHeight?: string;
}

/**
 * Loading skeleton for lazy-loaded components
 * Prevents layout shift by reserving space
 */
export const ComponentSkeleton = ({
  variant = "section",
  minHeight,
}: ComponentSkeletonProps) => {
  const getSkeletonContent = () => {
    switch (variant) {
      case "video":
        return (
          <div className="max-w-6xl mx-auto">
            {/* Header skeleton */}
            <div className="text-center mb-12 space-y-4">
              <div className="h-8 w-32 bg-surface-solid/50 rounded-full mx-auto animate-pulse" />
              <div className="h-12 w-96 bg-surface-solid/50 rounded-lg mx-auto animate-pulse" />
              <div className="h-6 w-64 bg-surface-solid/50 rounded-lg mx-auto animate-pulse" />
            </div>
            {/* Video player skeleton */}
            <div className="aspect-[4/3] bg-surface-solid/50 rounded-3xl animate-pulse" />
          </div>
        );

      case "cards":
        return (
          <div className="max-w-6xl mx-auto">
            {/* Header skeleton */}
            <div className="text-center mb-12 space-y-4">
              <div className="h-8 w-32 bg-surface-solid/50 rounded-full mx-auto animate-pulse" />
              <div className="h-12 w-96 bg-surface-solid/50 rounded-lg mx-auto animate-pulse" />
            </div>
            {/* Cards grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-48 bg-surface-solid/50 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          </div>
        );

      case "footer":
        return (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-4">
                  <div className="h-6 w-32 bg-surface-solid/50 rounded animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-surface-solid/50 rounded animate-pulse" />
                    <div className="h-4 w-28 bg-surface-solid/50 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-surface-solid/50 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="max-w-6xl mx-auto">
            {/* Generic section skeleton */}
            <div className="text-center mb-12 space-y-4">
              <div className="h-8 w-32 bg-surface-solid/50 rounded-full mx-auto animate-pulse" />
              <div className="h-12 w-96 bg-surface-solid/50 rounded-lg mx-auto animate-pulse" />
              <div className="h-6 w-80 bg-surface-solid/50 rounded-lg mx-auto animate-pulse" />
            </div>
            <div className="h-64 bg-surface-solid/50 rounded-2xl animate-pulse" />
          </div>
        );
    }
  };

  return (
    <div
      className="py-20 px-4 w-full"
      style={{ minHeight: minHeight || "400px" }}
    >
      {getSkeletonContent()}
    </div>
  );
};

export default ComponentSkeleton;
