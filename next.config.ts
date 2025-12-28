import type { NextConfig } from "next";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disable double rendering in development
  devIndicators: false,
  productionBrowserSourceMaps: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allow all HTTPS domains
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value:
              'camera=(self "chrome-extension://liecbddmkiiihnedobmlmillhodjkdmb"), microphone=(self "chrome-extension://liecbddmkiiihnedobmlmillhodjkdmb"), geolocation=()',
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.tavlo.app https://*.clerk.accounts.dev https://vercel.live https://va.vercel-scripts.com https://challenges.cloudflare.com; " +
              "worker-src 'self' blob: https://clerk.tavlo.app https://*.clerk.accounts.dev https://challenges.cloudflare.com; " +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
              "img-src 'self' data: blob: https: http://localhost:*; " +
              "font-src 'self' data: https://fonts.gstatic.com; " +
              "media-src 'self' https://res.cloudinary.com https://*.tiktokcdn.com https://*.tiktokcdn-us.com https://*.fbcdn.net https://*.facebook.com https://*.licdn.com https://*.linkedin.com https://*.cdninstagram.com https://*.instagram.com https://*.ytimg.com blob: data:; " +
              "connect-src 'self' https://clerk.tavlo.app https://*.clerk.accounts.dev https://api.clerk.com https://api.openai.com https://vercel.live https://vitals.vercel-insights.com https://vitals.vercel-analytics.com wss://ws-us3.pusher.com https://www.instagram.com https://*.instagram.com https://noembed.com https://api.microlink.io https://www.tiktok.com https://*.tiktok.com https://www.facebook.com https://*.facebook.com https://www.linkedin.com https://*.linkedin.com; " +
              "frame-src 'self' https://clerk.tavlo.app https://*.clerk.accounts.dev https://vercel.live https://challenges.cloudflare.com https://*.facebook.com https://www.facebook.com https://*.tiktok.com https://www.tiktok.com https://*.linkedin.com https://www.linkedin.com https://www.youtube.com https://www.youtube-nocookie.com https://www.instagram.com; " +
              "object-src 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self'; " +
              "frame-ancestors 'none'; " +
              "upgrade-insecure-requests;",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
