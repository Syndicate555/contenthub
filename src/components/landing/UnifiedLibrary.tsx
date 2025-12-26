"use client";

import React from "react";
import { motion } from "framer-motion";
import { FolderOpen, Twitter, Linkedin, Instagram } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { RedditIcon, YouTubeIcon } from "./PlatformIcons";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

type Platform = {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  textColor: string;
  itemCount: number;
  previewImage: string;
};

const PLATFORMS: Platform[] = [
  {
    id: "twitter",
    name: "Twitter",
    icon: Twitter,
    color: "from-[#1DA1F2] to-[#0d8bd9]",
    gradient: "bg-gradient-to-br from-[#1DA1F2] to-[#0d8bd9]",
    textColor: "text-blue-50",
    itemCount: 127,
    previewImage:
      "https://res.cloudinary.com/dggvt0gzu/image/upload/v1766719652/Screenshot_2025-12-25_at_10.24.29_PM_ve49oi.png",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "from-[#0077B5] to-[#00669c]",
    gradient: "bg-gradient-to-br from-[#0077B5] to-[#00669c]",
    textColor: "text-blue-50",
    itemCount: 89,
    previewImage:
      "https://res.cloudinary.com/dggvt0gzu/image/upload/v1766719652/Screenshot_2025-12-25_at_10.26.16_PM_phzatg.png",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: TikTokIcon,
    color: "from-[#ff0050] to-[#00f2ea]",
    gradient: "bg-gradient-to-br from-[#ff0050] via-[#000000] to-[#00f2ea]",
    textColor: "text-white",
    itemCount: 156,
    previewImage:
      "https://res.cloudinary.com/dggvt0gzu/image/upload/v1766719652/Screenshot_2025-12-25_at_10.25.03_PM_dagth8.png",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]",
    gradient: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]",
    textColor: "text-white",
    itemCount: 203,
    previewImage:
      "https://res.cloudinary.com/dggvt0gzu/image/upload/v1766719652/Screenshot_2025-12-25_at_10.26.41_PM_ss2bym.png",
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: RedditIcon,
    color: "from-[#ff4500] to-[#ff8717]",
    gradient: "bg-gradient-to-br from-[#ff4500] to-[#ff8717]",
    textColor: "text-white",
    itemCount: 64,
    previewImage:
      "https://res.cloudinary.com/dggvt0gzu/image/upload/v1766719652/Screenshot_2025-12-25_at_10.26.16_PM_phzatg.png",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: YouTubeIcon,
    color: "from-[#ff1f1f] to-[#b00000]",
    gradient: "bg-gradient-to-br from-[#ff1f1f] to-[#b00000]",
    textColor: "text-white",
    itemCount: 112,
    previewImage:
      "https://res.cloudinary.com/dggvt0gzu/image/upload/v1766719652/Screenshot_2025-12-25_at_10.25.03_PM_dagth8.png",
  },
];

export const UnifiedLibrary = () => {
  return (
    <section className="relative w-full bg-bg-page py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-12 md:mb-16 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-1/10 text-brand-1 text-sm font-semibold mb-6"
          >
            <FolderOpen className="w-4 h-4" />
            <span>ONE UNIFIED LIBRARY</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary mb-6"
          >
            All your content, perfectly organized{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-1 to-brand-2">
              In 1 Unified Library
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-text-secondary leading-relaxed"
          >
            Stop juggling multiple apps and browser tabs. Tavlo automatically
            organizes content from every platform into one searchable library.
          </motion.p>
        </div>

        <div className="flex flex-nowrap items-start justify-center gap-4 overflow-x-auto overflow-y-visible pt-4 pb-4 max-w-7xl mx-auto">
          {PLATFORMS.map((platform, index) => (
            <PlatformFolder
              key={platform.id}
              platform={platform}
              index={index}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-text-muted text-sm">
            Supports Twitter, LinkedIn, TikTok, Instagram, Reddit, YouTube, and
            any web content
          </p>
        </motion.div>
      </div>
    </section>
  );
};

const PlatformFolder = ({
  platform,
  index,
}: {
  platform: Platform;
  index: number;
}) => {
  const Icon = platform.icon;
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onHoverStart={() => setIsOpen(true)}
      onHoverEnd={() => setIsOpen(false)}
      className="relative h-[200px] w-48 shrink-0 cursor-pointer"
      style={{
        perspective: "800px",
      }}
    >
      {/* Folder Back (Base) */}
      <div
        className={cn(
          "absolute w-full h-32 rounded-xl shadow-lg z-15",
          platform.gradient,
        )}
        style={{
          position: "relative",
        }}
      >
        {/* Folder Tab */}
        <div
          className={cn(
            "absolute -top-3 left-0 w-[72px] h-6 rounded-t-xl",
            platform.gradient,
          )}
          style={{
            clipPath: "polygon(0% 0%, 50% 0%, 100% 100%, 0% 100%)",
          }}
        />
      </div>

      {/* Folder Front (Flap that opens) */}
      <motion.div
        className={cn(
          "absolute bottom-0 w-full rounded-xl shadow-xl cursor-pointer z-20",
          "bg-gradient-to-b",
          platform.gradient,
        )}
        style={{
          transformOrigin: "top",
        }}
        animate={
          isOpen
            ? {
                height: "110px",
                bottom: "-12px",
                rotateX: -20,
                scaleX: 1.05,
              }
            : {
                height: "125px",
                bottom: "0px",
                rotateX: 0,
                scaleX: 1,
              }
        }
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
      >
        <div className="p-4 h-full flex flex-col justify-between text-white">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5" />
                <h3 className="text-lg font-bold">{platform.name}</h3>
              </div>
              <p className="text-xs opacity-90">Notes & Saved Content</p>
            </div>
          </div>
          <div className="text-xs font-medium opacity-90">
            {platform.itemCount} items
          </div>
        </div>
      </motion.div>

      {/* File/Content Inside Folder */}
      <motion.div
        className="absolute bottom-0 left-3 right-3 bg-white rounded-2xl shadow-2xl overflow-hidden z-30"
        style={{
          height: "120px",
        }}
        animate={
          isOpen
            ? {
                y: -62,
                clipPath: "inset(0 0 30% 0)",
              }
            : {
                y: -17,
                clipPath: "inset(0 0 90% 0)",
              }
        }
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
      >
        <div className="relative w-full h-full">
          <Image
            src={platform.previewImage}
            alt={`${platform.name} content`}
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, 50vw"
          />

          {/* Platform Badge on Content */}
          <div className="absolute top-2 left-2 z-10">
            <div
              className={cn(
                "px-2 py-1 rounded-md flex items-center gap-1.5 shadow-lg backdrop-blur-sm",
                platform.gradient,
              )}
            >
              <Icon className={cn("w-3 h-3", platform.textColor)} />
              <span
                className={cn("text-[10px] font-semibold", platform.textColor)}
              >
                {platform.name} Posts
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UnifiedLibrary;
