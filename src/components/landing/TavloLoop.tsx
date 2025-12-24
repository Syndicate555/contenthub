"use client";

import React, { useRef, useEffect } from "react";

interface VideoItem {
  src: string;
  type?: "video" | "image";
  thumbnail?: string;
}

const TavloLoop = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Placeholder content - replace with actual videos
  const contentItems: VideoItem[] = [
    // Using placeholder images for now since we don't have videos
    {
      src: "https://res.cloudinary.com/dggvt0gzu/video/upload/v1766545573/SnapTik.Cx_1766545558_a5rqq5.mp4",
      type: "video",
    },
    {
      src: "https://res.cloudinary.com/dggvt0gzu/video/upload/v1766545480/SnapTik.Cx_1766545372_cimakw.mp4",
      type: "video",
    },
    {
      src: "https://res.cloudinary.com/dggvt0gzu/video/upload/v1766545488/SnapTik.Cx_1766545461_cx0fcj.mp4",
      type: "video",
    },
    {
      src: "https://res.cloudinary.com/dggvt0gzu/video/upload/v1766545478/SnapTik.Cx_1766545396_jivuza.mp4",
      type: "video",
    },
    {
      src: "https://www.pexels.com/download/video/4058084/",
      type: "video",
    },
    {
      src: "https://res.cloudinary.com/dggvt0gzu/video/upload/v1766545253/SnapTik.Cx_1766545244_o18tnl.mp4",
      type: "video",
    },
    {
      src: "https://res.cloudinary.com/dggvt0gzu/video/upload/v1766545181/SnapTik.Cx_1766545171_f6832j.mp4",
      type: "video",
    },
    {
      src: "https://res.cloudinary.com/dggvt0gzu/video/upload/v1766545112/SnapTik.Cx_1766545038_smnwxv.mp4",
      type: "video",
    },
    {
      src: "https://res.cloudinary.com/dggvt0gzu/video/upload/v1766544963/SnapTik.Cx_1766544954_tv4vs9.mp4",
      type: "video",
    },
    {
      src: "https://res.cloudinary.com/dggvt0gzu/video/upload/v1766544953/SnapTik.Cx_1766544917_ybipy1.mp4",
      type: "video",
    },
    {
      src: "https://res.cloudinary.com/dggvt0gzu/video/upload/v1766544844/SnapTik.Cx_1766544820_wlsyos.mp4",
      type: "video",
    },
  ];

  // Duplicate items for seamless loop
  const duplicatedItems = [...contentItems, ...contentItems];

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollPosition = 0;
    const scrollSpeed = 1.0;

    const scroll = () => {
      scrollPosition += scrollSpeed;

      // Reset position when we've scrolled through half the content (original set)
      const maxScroll = scrollContainer.scrollWidth / 2;
      if (scrollPosition >= maxScroll) {
        scrollPosition = 0;
      }

      scrollContainer.scrollLeft = scrollPosition;
      requestAnimationFrame(scroll);
    };

    const animationId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <section className="relative w-full py-0 overflow-hidden bg-gradient-to-b from-transparent via-brand-1/5 to-transparent -mt-4">
      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-bg-page to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-bg-page to-transparent z-10 pointer-events-none" />

      {/* Scrolling container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-hidden py-6 px-4"
        style={{
          scrollBehavior: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {duplicatedItems.map((item, index) => (
          <div
            key={index}
            className="flex-shrink-0 relative group"
            style={{
              width: "240px",
              height: "340px",
            }}
          >
            {item.type === "video" ? (
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-surface-secondary shadow-lg">
                <video
                  src={item.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  poster={item.thumbnail}
                />
              </div>
            ) : (
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-surface-secondary shadow-lg">
                <img
                  src={item.src}
                  alt={`Content ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-white text-sm font-medium px-4 text-center">
                    Your curated content here
                  </div>
                </div>
              </div>
            )}

            {/* Subtle border glow effect */}
            <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default TavloLoop;
