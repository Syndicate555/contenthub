"use client";

import React, { useRef, useState, useEffect, ReactNode } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useInView,
} from "framer-motion";
import { Play, Pause, Maximize2, X, Volume2, VolumeX } from "lucide-react";
import { videoChapters, videoConfig } from "@/data/landing";
import { CSSReveal, BackgroundOrbs } from "@/components/motion";

type VideoChapter = (typeof videoChapters)[number];

interface RecordingDotProps {
  isPlaying: boolean;
}

const RecordingDot = ({ isPlaying }: RecordingDotProps) => {
  if (!isPlaying) return null;

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full bg-red-500 recording-dot" />
      <span className="text-xs text-red-500 font-medium">REC</span>
    </div>
  );
};

interface BrowserChromeProps {
  children: ReactNode;
  isPlaying: boolean;
  hasRevealed: boolean;
  onMouseMove?: (pos: { x: number; y: number }) => void;
}

const BrowserChrome = ({
  children,
  isPlaying,
  hasRevealed,
  onMouseMove,
}: BrowserChromeProps) => {
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({
    x: 0.5,
    y: 0.5,
  });
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
    onMouseMove?.({ x, y });
  };

  const tiltX = prefersReducedMotion ? 0 : (mousePos.y - 0.5) * 4;
  const tiltY = prefersReducedMotion ? 0 : (mousePos.x - 0.5) * -4;

  return (
    <motion.div
      className="relative"
      onMouseMove={handleMouseMove}
      style={{
        transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
        transformStyle: "preserve-3d",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Outer glow */}
      <div className="absolute -inset-1 bg-gradient-to-br from-brand-1/20 via-brand-3/10 to-brand-2/20 rounded-[20px] blur-xl opacity-60" />

      {/* Light sweep shimmer (one-time) */}
      {hasRevealed && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-30"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </motion.div>
      )}

      {/* Main frame */}
      <div className="relative bg-surface-solid rounded-2xl overflow-hidden shadow-2xl shadow-black/15 border border-border-light">
        {/* Inner shadow overlay */}
        <div className="absolute inset-0 rounded-2xl shadow-[inset_0_2px_20px_rgba(0,0,0,0.05)] pointer-events-none z-10" />

        {/* Gradient edge highlight */}
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/50 to-transparent opacity-30 pointer-events-none"
          style={{ height: "2px" }}
        />

        {/* Window Chrome */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-gray-50 to-gray-100/80 border-b border-border-light">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57] hover:bg-[#FF5F57]/80 transition-colors cursor-pointer" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E] hover:bg-[#FFBD2E]/80 transition-colors cursor-pointer" />
              <div className="w-3 h-3 rounded-full bg-[#28CA41] hover:bg-[#28CA41]/80 transition-colors cursor-pointer" />
            </div>
            <AnimatePresence>
              <RecordingDot isPlaying={isPlaying} />
            </AnimatePresence>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1.5 bg-white/80 rounded-lg text-sm text-text-muted border border-border-light flex items-center gap-2 shadow-sm">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-brand-1 to-brand-2" />
            </div>
          </div>

          <div className="w-20" />
        </div>

        {/* Video content */}
        {children}

        {/* Bottom reflection */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
      </div>
    </motion.div>
  );
};

const ChapterButton = ({
  chapter,
  isActive,
  onClick,
  index,
  totalChapters,
}: {
  chapter: VideoChapter;
  isActive: boolean;
  onClick: () => void;
  index: number;
  totalChapters: number;
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl transition-all duration-300 group relative ${
        isActive
          ? "bg-surface-solid shadow-lg shadow-brand-1/10 border border-brand-1/20"
          : "bg-transparent hover:bg-surface/50 border border-transparent"
      }`}
    >
      {/* Glow effect for active */}
      {isActive && !prefersReducedMotion && (
        <motion.div
          className="absolute -inset-[1px] bg-gradient-to-r from-brand-1/20 via-brand-3/10 to-brand-2/20 rounded-xl blur-sm -z-10"
          layoutId="activeGlow"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Progress indicator */}
        <div className="flex flex-col items-center pt-1">
          <motion.div
            className={`w-3 h-3 rounded-full transition-all ${
              isActive
                ? "bg-gradient-to-br from-brand-1 to-brand-2 scale-125"
                : "bg-border-strong group-hover:bg-brand-1/50"
            }`}
            animate={
              isActive
                ? {
                    boxShadow: [
                      "0 0 0 0 rgba(91,91,255,0.4)",
                      "0 0 0 8px rgba(91,91,255,0)",
                      "0 0 0 0 rgba(91,91,255,0)",
                    ],
                  }
                : {}
            }
            transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
          />
          {index < totalChapters - 1 && (
            <div
              className={`w-0.5 h-8 mt-2 transition-colors ${
                isActive
                  ? "bg-gradient-to-b from-brand-2 to-border-light"
                  : "bg-border-light"
              }`}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4
              className={`font-semibold transition-colors ${
                isActive
                  ? "text-brand-1"
                  : "text-text-primary group-hover:text-brand-1"
              }`}
            >
              {chapter.title}
            </h4>
            <span className="text-xs text-text-muted">{chapter.subtitle}</span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
            {chapter.description}
          </p>

          {/* Stats */}
          {isActive && chapter.stats && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 mt-2"
            >
              {Object.entries(chapter.stats).map(([key, value]) => (
                <span
                  key={key}
                  className="text-xs px-2 py-0.5 bg-brand-1-light text-brand-1 rounded-full font-medium"
                >
                  {value} {key}
                </span>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </button>
  );
};

const VideoDemo = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(containerRef, { amount: 0.3 });

  // Load video when in view (user-initiated play)
  useEffect(() => {
    if (!videoRef.current) return;

    if (isInView && !hasRevealed) {
      // Load the video but don't autoplay
      videoRef.current.load();
      setHasRevealed(true);
    }
  }, [isInView, hasRevealed]);

  // Update chapter based on video time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      for (let i = videoChapters.length - 1; i >= 0; i--) {
        if (currentTime >= videoChapters[i].timestamp) {
          setActiveChapter(i);
          break;
        }
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  const handleChapterClick = (index: number) => {
    setActiveChapter(index);
    if (videoRef.current) {
      videoRef.current.currentTime = videoChapters[index].timestamp;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      return;
    }

    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const openFullscreen = () => {
    setShowModal(true);
  };

  return (
    <section
      id="demo"
      className="py-20 md:py-28 px-4 relative overflow-hidden"
      ref={containerRef}
    >
      <BackgroundOrbs variant="demo" />

      {/* Section header */}
      <div className="max-w-6xl mx-auto text-center mb-12">
        <CSSReveal>
          <span className="inline-flex items-center gap-2 badge-brand mb-4">
            Product Preview
          </span>
        </CSSReveal>
        <CSSReveal delay={0.1}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-4">
            See Tavlo{" "}
            <span className="bg-gradient-to-r from-brand-2 to-brand-1 bg-clip-text text-transparent">
              in action
            </span>
          </h2>
        </CSSReveal>
        <CSSReveal delay={0.2}>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            A calm, organized space for all your saved content—watch how it
            works.
          </p>
        </CSSReveal>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto glass-strong rounded-3xl p-6 md:p-8 border border-border-medium">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Chapter navigation */}
          <div className="w-full md:w-[280px] md:shrink-0 space-y-2 md:sticky md:top-28">
            {videoChapters.map((chapter, index) => (
              <ChapterButton
                key={chapter.id}
                chapter={chapter}
                isActive={activeChapter === index}
                onClick={() => handleChapterClick(index)}
                index={index}
                totalChapters={videoChapters.length}
              />
            ))}
          </div>

          {/* Video player */}
          <div className="flex-1 w-full min-w-0">
            <BrowserChrome isPlaying={isPlaying} hasRevealed={hasRevealed}>
              <div className="relative aspect-[4/3] bg-gray-900">
                {/* Loading state */}
                {!isLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="w-12 h-12 border-2 border-brand-1/30 border-t-brand-1 rounded-full animate-spin" />
                  </div>
                )}

                <video
                  ref={videoRef}
                  src={videoConfig.src}
                  poster={videoConfig.poster || undefined}
                  muted={isMuted}
                  loop
                  playsInline
                  autoPlay={false}
                  preload="none"
                  controls={false}
                  onLoadedData={() => setIsLoaded(true)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={() => setIsLoaded(true)}
                  className="w-full h-full object-contain"
                />
                {/* Video controls overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 text-text-primary" />
                      ) : (
                        <Play className="w-6 h-6 text-text-primary ml-1" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="flex items-center justify-between">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={activeChapter}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-white text-sm font-medium"
                      >
                        {videoChapters[activeChapter].description}
                      </motion.p>
                    </AnimatePresence>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleMute}
                        className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4 text-white" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-white" />
                        )}
                      </button>
                      <button
                        onClick={openFullscreen}
                        className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                      >
                        <Maximize2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </BrowserChrome>

            {/* Chapter dots */}
            <div className="flex justify-center gap-2 mt-4">
              {videoChapters.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleChapterClick(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeChapter === index
                      ? "bg-brand-1 w-6"
                      : "bg-border-strong hover:bg-brand-1/50 w-2"
                  }`}
                  aria-label={`Go to ${videoChapters[index].title}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <video
                src={videoConfig.src}
                controls
                autoPlay
                className="w-full rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default VideoDemo;
