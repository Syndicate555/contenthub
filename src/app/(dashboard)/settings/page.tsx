import SettingsPageClient from "./SettingsPageClient";
import { SWRConfig } from "swr";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Force dynamic rendering since we depend on authenticated headers during build
export const dynamic = "force-dynamic";

async function getSettingsData() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    // Fetch connections, focus areas, and import counts in parallel
    const [connections, focusAreas, importCounts] = await Promise.all([
      db.socialConnection.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          provider: true,
          providerHandle: true,
          lastSyncAt: true,
          syncEnabled: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      db.focusArea.findMany({
        where: { userId: user.id },
        include: {
          domain: {
            select: {
              id: true,
              name: true,
              displayName: true,
              description: true,
              icon: true,
              color: true,
            },
          },
        },
        orderBy: { priority: "asc" },
      }),
      db.item.groupBy({
        by: ["importSource"],
        where: {
          userId: user.id,
          importSource: { not: null },
        },
        _count: true,
      }),
    ]);

    const countMap = new Map<string, number>(
      importCounts.map((c) => [c.importSource!, c._count]),
    );

    return {
      ok: true,
      data: {
        connections: connections.map((c) => ({
          id: c.id,
          provider: c.provider,
          providerHandle: c.providerHandle,
          handle: c.providerHandle,
          lastSyncAt: c.lastSyncAt,
          syncEnabled: c.syncEnabled,
          connectedAt: c.createdAt,
          createdAt: c.createdAt,
          importedCount: countMap.get(c.provider) || 0,
        })),
        focusAreas: focusAreas.map((fa) => ({
          id: fa.id,
          priority: fa.priority,
          domain: fa.domain,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching settings data:", error);
    return null;
  }
}

function SettingsSkeleton() {
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

export default async function SettingsPage() {
  // Fetch data on server for instant display (no loading state)
  const settingsData = await getSettingsData();

  return (
    <SWRConfig
      value={{
        fallback: settingsData
          ? {
              "/api/dashboard/settings": settingsData,
            }
          : {},
      }}
    >
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsPageClient fallbackData={settingsData} />
      </Suspense>
    </SWRConfig>
  );
}
