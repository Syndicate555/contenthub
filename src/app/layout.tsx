import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/sonner";
import { SWRProvider } from "@/components/providers/swr-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { WebVitals } from "@/components/web-vitals";
import { ConsoleSuppressor } from "@/components/ConsoleSuppressor";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tavlo.ca"),
  title: {
    default: "Tavlo - Your Personal Second Brain for Social Media",
    template: "%s | Tavlo",
  },
  description:
    "Tavlo helps you save, organize, and revisit valuable social media content. Your personal knowledge hub for Twitter, LinkedIn, Instagram, and more.",
  keywords: [
    "content management",
    "social media organizer",
    "second brain",
    "knowledge management",
    "content curation",
    "social media bookmarks",
  ],
  authors: [{ name: "Tavlo" }],
  creator: "Tavlo",
  publisher: "Tavlo",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/tavo_logo.png",
    shortcut: "/tavo_logo.png",
    apple: "/tavo_logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tavlo.ca",
    siteName: "Tavlo",
    title: "Tavlo - Your Personal Second Brain for Social Media",
    description:
      "Save, organize, and revisit valuable social media content from Twitter, LinkedIn, Instagram, and more.",
    images: [
      {
        url: "/tavo_logo.png",
        width: 1200,
        height: 630,
        alt: "Tavlo - Personal Second Brain",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tavlo - Your Personal Second Brain for Social Media",
    description:
      "Save, organize, and revisit valuable social media content from Twitter, LinkedIn, Instagram, and more.",
    images: ["/tavo_logo.png"],
    creator: "@tavlo",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add Google Search Console verification code here when available
    // google: "your-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/today"
      signUpFallbackRedirectUrl="/today"
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <ConsoleSuppressor />
            <WebVitals />
            <SpeedInsights />
            <Analytics />
            <SWRProvider>
              <SessionProvider>{children}</SessionProvider>
            </SWRProvider>
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
