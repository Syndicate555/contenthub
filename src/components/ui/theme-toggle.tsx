"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const getLabel = () => {
    if (theme === "system") return "System theme";
    if (theme === "dark") return "Dark theme";
    return "Light theme";
  };

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        "p-2 rounded-lg transition-colors",
        "text-muted-foreground hover:text-foreground hover:bg-accent",
      )}
      aria-label={getLabel()}
      title={getLabel()}
    >
      {theme === "system" ? (
        <Monitor className="w-5 h-5" />
      ) : resolvedTheme === "dark" ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}
