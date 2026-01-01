import React from "react";
import { BackgroundOrbs, CSSReveal } from "@/components/motion";

const YOUTUBE_EMBED_URL =
  "https://www.youtube-nocookie.com/embed/1RvLujo1ZwU?rel=0&modestbranding=1&playsinline=1";
const YOUTUBE_WATCH_URL =
  "https://youtu.be/1RvLujo1ZwU?si=rE2XLVfPw7Fz8AFb";

const YoutubeDemo = () => {
  return (
    <section
      id="youtube-demo"
      className="py-20 md:py-28 px-4 relative overflow-hidden"
      aria-labelledby="youtube-demo-heading"
    >
      <BackgroundOrbs variant="demo" />

      <div className="max-w-6xl mx-auto text-center mb-12">
        <CSSReveal>
          <span className="inline-flex items-center gap-2 badge-brand mb-4">
            Video Demo
          </span>
        </CSSReveal>
        <CSSReveal delay={0.1}>
          <h2
            id="youtube-demo-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-4"
          >
            Watch the full Tavlo{" "}
            <span className="bg-gradient-to-r from-brand-1 to-brand-2 bg-clip-text text-transparent">
              walkthrough
            </span>
          </h2>
        </CSSReveal>
        <CSSReveal delay={0.2}>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            See how Tavlo captures, organizes, and resurfaces your best content
            in a short guided demo.
          </p>
        </CSSReveal>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl border border-border-light bg-surface-solid shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
          <div className="relative w-full aspect-video bg-black">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={YOUTUBE_EMBED_URL}
              title="Tavlo product demo video"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 px-5 py-4 bg-surface-solid/80 backdrop-blur-sm">
            <p className="text-sm text-text-secondary">
              Prefer YouTube?{" "}
              <a
                href={YOUTUBE_WATCH_URL}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-brand-1 hover:text-brand-2 underline underline-offset-4"
              >
                Watch on YouTube
              </a>
            </p>
            <p className="text-xs text-text-muted">
              Demo video hosted on YouTube
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default YoutubeDemo;
