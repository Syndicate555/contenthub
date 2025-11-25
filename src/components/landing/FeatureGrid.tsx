import { Sparkles, Inbox, Zap, ShieldCheck, BotMessageSquare, Gauge } from "lucide-react";

export function FeatureGrid() {
  const features = [
    {
      title: "Capture from anywhere",
      description: "Drop in links from Twitter, Instagram, LinkedIn, or any web page. Forward newsletters to your personal email address.",
      icon: Inbox,
      tone: "from-indigo-500/15 to-indigo-500/5",
    },
    {
      title: "AI distillation",
      description: "Automatic extraction, summaries, tags, domains, and image previews. Uses GPT-4.1-mini and 4o-mini for vision.",
      icon: BotMessageSquare,
      tone: "from-emerald-500/15 to-emerald-500/5",
    },
    {
      title: "Daily review mode",
      description: "A focused Today inbox to Pin, Archive, or Delete quickly—no more scroll fatigue or lost tabs.",
      icon: Gauge,
      tone: "from-cyan-500/15 to-cyan-500/5",
    },
    {
      title: "Built-in safety & control",
      description: "Clerk auth, token encryption, webhook signature verification, and platform-specific fallbacks.",
      icon: ShieldCheck,
      tone: "from-slate-500/15 to-slate-500/5",
    },
    {
      title: "Gamified retention",
      description: "Earn XP, keep streaks alive, unlock badges, and see domain-level progress for your focus areas.",
      icon: Sparkles,
      tone: "from-amber-500/15 to-amber-500/5",
    },
    {
      title: "Fast and responsive",
      description: "Prefetching, SWR caching, optimized queries, and smooth micro-interactions for instant navigation.",
      icon: Zap,
      tone: "from-blue-500/15 to-blue-500/5",
    },
  ];

  return (
    <section id="features" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-indigo-600">
            The stack behind ContentHub
          </p>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            A thoughtful pipeline from capture to clarity to action.
          </h2>
          <p className="text-lg text-gray-600">
            Purpose-built for creators and operators who live across social feeds and newsletters.
            Everything is distilled, searchable, and tracked.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/50 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div
                  className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br ${feature.tone}`}
                />
                <div className="relative flex items-center justify-center h-11 w-11 rounded-xl bg-white shadow-inner ring-1 ring-gray-100 text-indigo-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="relative mt-4 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="relative mt-2 text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
