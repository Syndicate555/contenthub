"use client";

import { Mail } from "lucide-react";
import {
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
  MessageCircle,
  Video,
} from "lucide-react";

interface Source {
  source: string;
  displayName: string;
  icon: string;
  count: number;
}

interface SourceBreakdownProps {
  sources: Source[];
}

/**
 * Format large numbers: 1234 → 1.2k, 1000000 → 1M
 */
function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

// Platform brand colors and icons
const platformConfig: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    iconClassName: string;
    bgClassName: string;
  }
> = {
  twitter: {
    icon: Twitter,
    iconClassName: "text-[#1DA1F2]",
    bgClassName: "bg-[#1DA1F2]/10 dark:bg-[#1DA1F2]/20",
  },
  facebook: {
    icon: Facebook,
    iconClassName: "text-[#1DA1F2]",
    bgClassName: "bg-[#1DA1F2]/10 dark:bg-[#1DA1F2]/20",
  },
  linkedin: {
    icon: Linkedin,
    iconClassName: "text-[#0A66C2]",
    bgClassName: "bg-[#0A66C2]/10 dark:bg-[#0A66C2]/20",
  },
  instagram: {
    icon: Instagram,
    iconClassName: "text-[#E4405F]",
    bgClassName: "bg-[#E4405F]/10 dark:bg-[#E4405F]/20",
  },
  youtube: {
    icon: Youtube,
    iconClassName: "text-[#FF0000]",
    bgClassName: "bg-[#FF0000]/10 dark:bg-[#FF0000]/20",
  },
  reddit: {
    icon: MessageCircle,
    iconClassName: "text-[#FF4500]",
    bgClassName: "bg-[#FF4500]/10 dark:bg-[#FF4500]/20",
  },
  tiktok: {
    icon: Video,
    iconClassName: "text-[#111827] dark:text-[#25F4EE]",
    bgClassName: "bg-[#111827]/10 dark:bg-[#25F4EE]/15",
  },
  newsletter: {
    icon: Mail,
    iconClassName: "text-indigo-600 dark:text-indigo-300",
    bgClassName: "bg-indigo-50 dark:bg-indigo-500/20",
  },
};

export function SourceBreakdown({ sources }: SourceBreakdownProps) {
  if (sources.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
          <Mail className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground font-medium mb-1">
          No items saved yet
        </p>
        <p className="text-xs text-muted-foreground/80">
          Start saving content to see your sources here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {sources.map((source, index) => {
        const platformKey = source.source.toLowerCase();
        const config = platformConfig[platformKey] || {
          icon: Mail,
          iconClassName: "text-muted-foreground",
          bgClassName: "bg-muted",
        };
        const Icon = config.icon;

        return (
          <div
            key={source.source}
            className="flex items-center justify-between p-2 rounded-lg border border-transparent bg-card"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-lg ${config.bgClassName} ${config.iconClassName} flex-shrink-0 shadow-sm`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs text-muted-foreground font-medium truncate">
                {source.displayName}
              </span>
            </div>
            <span className="text-xs font-bold text-foreground ml-2 flex-shrink-0 min-w-[1.5rem] text-right">
              {formatCount(source.count)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
