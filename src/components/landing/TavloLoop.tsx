"use client";

import React, { useRef, useEffect, useState } from "react";

interface VideoItem {
  src: string;
  type?: "video" | "image";
  thumbnail?: string;
}

const TavloLoop = () => {
  const [loadedVideos, setLoadedVideos] = useState<Set<number>>(
    new Set([0, 1, 2, 3]),
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const innerContainerRef = useRef<HTMLDivElement>(null);

  // Content items from Supabase Storage
  const contentItems: VideoItem[] = [
    {
      src: "https://gnxrddsvzynszstsraer.supabase.co/storage/v1/object/public/Tavlo/SnapTik.Cx_1766544616_vcrcjs.mp4",
      type: "video",
    },
    {
      src: "https://gnxrddsvzynszstsraer.supabase.co/storage/v1/object/public/Tavlo/SnapTik.Cx_1766544820_wlsyos.mp4",
      type: "video",
    },
    {
      src: "https://gnxrddsvzynszstsraer.supabase.co/storage/v1/object/public/Tavlo/SnapTik.Cx_1766544917_ybipy1.mp4",
      type: "video",
    },
    {
      src: "https://gnxrddsvzynszstsraer.supabase.co/storage/v1/object/public/Tavlo/SnapTik.Cx_1766544954_tv4vs9.mp4",
      type: "video",
    },
    {
      src: "https://gnxrddsvzynszstsraer.supabase.co/storage/v1/object/public/Tavlo/SnapTik.Cx_1766545038_smnwxv.mp4",
      type: "video",
    },
    {
      src: "https://gnxrddsvzynszstsraer.supabase.co/storage/v1/object/public/Tavlo/SnapTik.Cx_1766545171_f6832j.mp4",
      type: "video",
    },
    {
      src: "https://gnxrddsvzynszstsraer.supabase.co/storage/v1/object/public/Tavlo/SnapTik.Cx_1766545244_o18tnl.mp4",
      type: "video",
    },
    {
      src: "https://gnxrddsvzynszstsraer.supabase.co/storage/v1/object/public/Tavlo/SnapTik.Cx_1766545372_cimakw.mp4",
      type: "video",
    },
    {
      src: "https://gnxrddsvzynszstsraer.supabase.co/storage/v1/object/public/Tavlo/SnapTik.Cx_1766545396_jivuza.mp4",
      type: "video",
    },
    {
      src: "https://gnxrddsvzynszstsraer.supabase.co/storage/v1/object/public/Tavlo/SnapTik.Cx_1766545461_cx0fcj.mp4",
      type: "video",
    },
  ];

  // Horizontal scrolling with seamless loop
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const innerContainer = innerContainerRef.current;
    if (!scrollContainer || !innerContainer) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.9; // pixels per frame
    let animationFrameId: number;

    const scroll = () => {
      scrollPosition += scrollSpeed;

      // Get the width of one set of items (not including clones)
      const itemWidth = 240 + 12; // width + gap
      const totalWidth = itemWidth * contentItems.length;

      // When we've scrolled past the original items, reset to start
      if (scrollPosition >= totalWidth) {
        scrollPosition = 0;
      }

      scrollContainer.scrollLeft = scrollPosition;
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [contentItems.length]);

  // Intersection observer for lazy loading remaining videos
  useEffect(() => {
    if (typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(
              entry.target.getAttribute("data-index") || "0",
              10,
            );
            setLoadedVideos((prev) => new Set([...prev, index]));
          }
        });
      },
      { rootMargin: "200px" },
    );

    // Observe all video containers
    const videoElements =
      innerContainerRef.current?.querySelectorAll("[data-index]");
    videoElements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative w-full py-0 overflow-hidden bg-gradient-to-b from-transparent via-brand-1/5 to-transparent -mt-4">
      {/* Gradient overlays for fade effect - Desktop only */}
      <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-bg-page to-transparent z-10 pointer-events-none" />
      <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-bg-page to-transparent z-10 pointer-events-none" />

      {/* Scrolling container with horizontal scroll */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-hidden py-6 px-4"
        style={{
          scrollBehavior: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div
          ref={innerContainerRef}
          className="flex gap-3"
          style={{
            width: "max-content",
          }}
        >
          {/* Render original items */}
          {contentItems.map((item, index) => (
            <div
              key={index}
              data-index={index}
              className="flex-shrink-0 relative group"
              style={{
                width: "240px",
                height: "340px",
              }}
            >
              {item.type === "video" ? (
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-surface-secondary shadow-lg">
                  {loadedVideos.has(index) ? (
                    <video
                      src={item.src}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                      poster={item.thumbnail}
                      aria-label={`Content preview ${index + 1}`}
                    >
                      <track
                        kind="captions"
                        srcLang="en"
                        label="English captions"
                      />
                    </video>
                  ) : (
                    // Placeholder while video loads
                    <div className="w-full h-full bg-surface-secondary flex items-center justify-center">
                      <div className="w-12 h-12 border-2 border-brand-1/30 border-t-brand-1 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-surface-secondary shadow-lg">
                  <img
                    src={item.src}
                    alt={`Content ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Subtle border glow effect */}
              <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />
            </div>
          ))}

          {/* Clone first few items for seamless loop */}
          {contentItems.slice(0, 3).map((item, index) => (
            <div
              key={`clone-${index}`}
              className="flex-shrink-0 relative group"
              style={{
                width: "240px",
                height: "340px",
              }}
              aria-hidden="true"
            >
              {item.type === "video" ? (
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-surface-secondary shadow-lg">
                  {loadedVideos.has(index) ? (
                    <video
                      src={item.src}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                      poster={item.thumbnail}
                      aria-label={`Content preview ${index + 1}`}
                    >
                      <track
                        kind="captions"
                        srcLang="en"
                        label="English captions"
                      />
                    </video>
                  ) : (
                    <div className="w-full h-full bg-surface-secondary" />
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-surface-secondary shadow-lg">
                  <img
                    src={item.src}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TavloLoop;
