// Landing page content data

export const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Demo", href: "#demo" },
  { label: "FAQ", href: "#faq" },
];

export const socialProofItems = [
  "Founders",
  "Students",
  "Creators",
  "Researchers",
  "Engineers",
];

export const howItWorksSteps = [
  {
    step: 1,
    title: "Capture",
    description:
      "Save posts, threads, and videos as you normally would across your favorite platforms.",
    icon: "Bookmark",
  },
  {
    step: 2,
    title: "Sync",
    description:
      "Tavlo automatically pulls in your saved content from X, YouTube, LinkedIn, and more.",
    icon: "RefreshCw",
  },
  {
    step: 3,
    title: "Distill",
    description:
      "AI generates clean summaries, key takeaways, and smart tags for every piece.",
    icon: "Sparkles",
  },
  {
    step: 4,
    title: "Organize",
    description:
      "Everything lands in a searchable library with smart folders and collections.",
    icon: "FolderOpen",
  },
  {
    step: 5,
    title: "Replay",
    description:
      "Resurface content through a calm feed and smart reminders when you need it.",
    icon: "Play",
  },
];

export const features = [
  {
    title: "AI Summaries",
    description:
      "Get instant, clear summaries of every saved post, thread, or video.",
    icon: "FileText",
  },
  {
    title: "Smart Tags",
    description:
      "Automatic topic detection and tagging so you never lose track.",
    icon: "Tags",
  },
  {
    title: "Powerful Search",
    description:
      "Find anything instantly with filters by source, topic, creator, or date.",
    icon: "Search",
  },

  {
    title: "Calm Replay Feed",
    description:
      "A peaceful second feed that resurfaces what matters, without the noise.",
    icon: "Repeat",
  },
  {
    title: "Multi-Source Support",
    description:
      "Connect X, YouTube, LinkedIn, Instagram, and more in one place.",
    icon: "Globe",
  },

  {
    title: "Privacy First",
    description:
      "Your data stays yours. No weird growth hacks, just honest tooling.",
    icon: "Shield",
  },
];

// Video demo chapters with timestamps (seconds)
export const videoChapters = [
  {
    id: "inbox",
    title: "Inbox",
    subtitle: "Your personal feed",
    description:
      "Every save flows into a calm, AI-enhanced feed—no algorithmic noise.",
    timestamp: 0,
    stats: { items: 47, unread: 12 },
  },
  {
    id: "library",
    title: "Library",
    subtitle: "Search + categories",
    description:
      "Find anything instantly with powerful search across all your saves.",
    timestamp: 35,
    stats: { items: 284, categories: 18 },
  },
  {
    id: "filters",
    title: "Smart Filters",
    subtitle: "Source, author, tags",
    description:
      "Filter by platform, creator, topic, or custom tags you create.",
    timestamp: 44,
    stats: { sources: 5, tags: 34 },
  },
  {
    id: "progress",
    title: "Progress",
    subtitle: "Levels + streak",
    description:
      "Track your learning journey with streaks, levels, and insights.",
    timestamp: 88,
    stats: { streak: 14, level: 8 },
  },
  {
    id: "achievements",
    title: "Achievements",
    subtitle: "Badges",
    description:
      "Earn badges for consistency and unlock new features as you grow.",
    timestamp: 105,
    stats: { badges: 12, unlocked: 8 },
  },
];

// Video configuration
export const videoConfig = {
  src: "https://res.cloudinary.com/dggvt0gzu/video/upload/v1766763250/tavlo_demo_xbvxgg.mp4",
  // Poster frame from video (first frame, optimized)
  poster:
    "https://res.cloudinary.com/dggvt0gzu/video/upload/v1766763250/tavlo_demo_xbvxgg.jpg",
  duration: 120, // approximate duration in seconds
};

// Tavlo Loop steps for signature animation
export const tavloLoopSteps = [
  {
    id: "capture",
    title: "Capture",
    subtitle: "Save what resonates",
    description: "Hit save on any platform. Tavlo grabs the context.",
    icon: "Bookmark",
    detail: "Saved from LinkedIn",
    example: {
      author: "Sarah Chen",
      handle: "@sarahchen",
      content:
        "The best founders I know spend 30% of their time learning. Not consuming—actually synthesizing and applying.",
      platform: "linkedin",
    },
  },
  {
    id: "distill",
    title: "Distill",
    subtitle: "AI extracts the signal",
    description: "Key points, summaries, and insights—automatically.",
    icon: "Sparkles",
    detail: "3 key points • 45 sec read",
    example: {
      summary:
        "Successful founders prioritize active learning over passive consumption, dedicating significant time to synthesis and application.",
      keyPoints: [
        "30% time on learning",
        "Synthesis over consumption",
        "Apply what you learn",
      ],
    },
  },
  {
    id: "organize",
    title: "Organize",
    subtitle: "Smart tags & collections",
    description: "Auto-categorized, searchable, connected.",
    icon: "FolderOpen",
    detail: "Added to 2 collections",
    example: {
      tags: ["productivity", "founders", "learning"],
      collections: ["Startup Wisdom", "Personal Growth"],
    },
  },
  {
    id: "replay",
    title: "Replay",
    subtitle: "Resurface when it matters",
    description: "The right insight, at the right moment.",
    icon: "RotateCcw",
    detail: "You saved this 14 days ago",
    example: {
      resurfaceReason: "Related to your recent saves about productivity",
      savedAgo: "14 days",
    },
  },
];

// Why Tavlo exists content
export const whyTavloContent = {
  headline: "We built Tavlo because we were tired of the junk drawer.",
  points: [
    "You save great content with good intentions.",
    "Then it disappears into a black hole of bookmarks.",
    "Tavlo is different: it helps you actually *use* what you save.",
  ],
  cta: "A calm second feed, built for reuse—not hoarding.",
};

export const testimonials = [
  {
    quote:
      "I used to save hundreds of tweets and never look at them again. Tavlo changed that completely.",
    author: "Alex M.",
    role: "Startup Founder",
  },
  {
    quote:
      "Finally, a tool that makes my saved content actually useful. The AI summaries save me hours.",
    author: "Sarah K.",
    role: "Content Creator",
  },
  {
    quote:
      "The smart collections feature is genius. It's like having a research assistant.",
    author: "James L.",
    role: "Graduate Student",
  },
  {
    quote:
      "Clean, calm, and incredibly useful. This is what my bookmarks folder always wanted to be.",
    author: "Priya R.",
    role: "Product Designer",
  },
  {
    quote:
      "I learn so much more now that I actually revisit what I save. Game changer for retention.",
    author: "Marcus T.",
    role: "Software Engineer",
  },
  {
    quote:
      "The replay feature helps me actually apply what I've been hoarding for years.",
    author: "Emma W.",
    role: "Marketing Lead",
  },
];

export const faqs = [
  {
    question: "How is this different from bookmarks?",
    answer:
      "Bookmarks are a black hole—you save things and forget them. Tavlo actively organizes, summarizes, and resurfaces your saved content so you actually use it. Think of it as an intelligent second brain, not a junk drawer.",
  },
  {
    question: "Do you sell my data?",
    answer:
      "Never. Your saved content is yours. We don't sell data, share it with advertisers, or use it for any purpose other than providing you the service. Privacy is core to how we build.",
  },
  {
    question: "Which platforms are supported?",
    answer:
      "We currently support X/Twitter, YouTube, LinkedIn, Instagram, Reddit, TikTok, podcasts, newsletters, and web articles",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes! We'll offer a generous free tier that covers most personal use cases. Premium plans will unlock unlimited imports, advanced AI features, and deeper integrations.",
  },
  {
    question: "How does Tavlo import my saved content?",
    answer:
      "For the Beta we're only allowing manual adding posts using links but we're also working on OAuth connections and a browser extension to seamlessly capture links without any copy pasting",
  },
];
