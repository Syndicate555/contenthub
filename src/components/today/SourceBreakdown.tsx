"use client";

import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import {
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
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
    color: string;
    bgColor: string;
  }
> = {
  twitter: {
    icon: Twitter,
    color: "#1DA1F2",
    bgColor: "bg-[#1DA1F2]/10",
  },
  linkedin: {
    icon: Linkedin,
    color: "#0A66C2",
    bgColor: "bg-[#0A66C2]/10",
  },
  instagram: {
    icon: Instagram,
    color: "#E4405F",
    bgColor: "bg-[#E4405F]/10",
  },
  youtube: {
    icon: Youtube,
    color: "#FF0000",
    bgColor: "bg-[#FF0000]/10",
  },
  reddit: {
    icon: MessageCircle,
    color: "#FF4500",
    bgColor: "bg-[#FF4500]/10",
  },
  tiktok: {
    icon: Video,
    color: "#000000",
    bgColor: "bg-black/10",
  },
  newsletter: {
    icon: Mail,
    color: "#6366F1",
    bgColor: "bg-indigo-50",
  },
};

export function SourceBreakdown({ sources }: SourceBreakdownProps) {
  if (sources.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Mail className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-600 font-medium mb-1">
          No items saved yet
        </p>
        <p className="text-xs text-gray-500">
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
          color: "#6B7280",
          bgColor: "bg-gray-100",
        };
        const Icon = config.icon;

        return (
          <motion.div
            key={source.source}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-gray-200"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
                className={`flex items-center justify-center w-7 h-7 rounded-lg ${config.bgColor} flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow`}
                style={{ color: config.color }}
              >
                <Icon className="w-3.5 h-3.5" />
              </motion.div>
              <span className="text-xs text-gray-700 font-medium truncate group-hover:text-gray-900 transition-colors">
                {source.displayName}
              </span>
            </div>
            <motion.span
              key={source.count}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-xs font-bold text-gray-900 ml-2 flex-shrink-0 min-w-[1.5rem] text-right"
            >
              {formatCount(source.count)}
            </motion.span>
          </motion.div>
        );
      })}
    </div>
  );
}
