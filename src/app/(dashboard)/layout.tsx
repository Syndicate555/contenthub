"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Inbox, FolderOpen, Plus, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { prefetchTodayItems, prefetchCategories } from "@/hooks/use-items";
import {
  prefetchProfileData,
  prefetchSettingsData,
} from "@/hooks/use-dashboard";
import { useCallback } from "react";
import { useTimezoneSync } from "@/hooks/use-timezone-sync";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Auto-detect and sync user's timezone for accurate streak tracking
  useTimezoneSync();

  // Prefetch functions for instant navigation
  const prefetchToday = useCallback(() => {
    prefetchTodayItems();
  }, []);

  const prefetchLibrary = useCallback(() => {
    prefetchCategories();
  }, []);

  const prefetchProfile = useCallback(() => {
    prefetchProfileData();
  }, []);

  const prefetchSettings = useCallback(() => {
    prefetchSettingsData();
  }, []);

  const navItems = [
    {
      href: "/today",
      label: "Inbox",
      icon: Inbox,
      isActive: pathname === "/today",
      onPrefetch: prefetchToday,
    },
    {
      href: "/items",
      label: "Library",
      icon: FolderOpen,
      isActive: pathname === "/items" || pathname.startsWith("/items?"),
      onPrefetch: prefetchLibrary,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: User,
      isActive: pathname === "/profile",
      onPrefetch: prefetchProfile,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/today" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-linear-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">TV</span>
              </div>
              <span className="font-semibold text-foreground hidden sm:inline">
                Tavlo
              </span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  // Prefetch data on hover for instant navigation
                  onMouseEnter={item.onPrefetch}
                  onFocus={item.onPrefetch}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    item.isActive
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                >
                  <item.icon
                    className={cn("w-4 h-4", item.isActive && "text-foreground")}
                  />
                  <span className="hidden sm:inline">{item.label}</span>
                  {/* Active indicator */}
                  {item.isActive && (
                    <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-foreground rounded-full" />
                  )}
                </Link>
              ))}
              <Link
                href="/add"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add</span>
              </Link>
            </nav>

            {/* Theme, Settings & User Button */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/settings"
                onMouseEnter={prefetchSettings}
                onFocus={prefetchSettings}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  pathname === "/settings"
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                <Settings className="w-5 h-5" />
              </Link>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl xl:max-w-[1300px] mx-auto px-4 md:px-8 lg:px-12 py-6">
        {children}
      </main>
    </div>
  );
}
