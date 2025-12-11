import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  LineChart,
  Clock3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  displayFontClass: string;
}

export function Hero({ displayFontClass }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50 py-16 sm:py-20">
      <div className="absolute inset-x-0 -top-32 mx-auto h-72 w-[110%] rounded-full bg-gradient-to-r from-indigo-100 via-cyan-50 to-emerald-100 blur-3xl" />
      <div className="absolute right-10 top-10 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-200 to-blue-100 blur-2xl opacity-70 animate-float-slow" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              AI-first second brain for social content
            </div>
            <h1
              className={`${displayFontClass} text-4xl leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl`}
            >
              Capture every idea. <br className="hidden sm:block" />
              Summarize with AI. <br className="hidden sm:block" />
              Level up every day.
            </h1>
            <p className="max-w-2xl text-lg text-gray-600">
              Tavlo automatically distills links, tweets, reels, and
              newsletters into clear takeaways—then turns your reading habit
              into XP, streaks, and badges. Focus on what matters, not on tabs.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                className="px-5 text-base shadow-lg shadow-indigo-200"
              >
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2"
                >
                  Sign in to start
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="px-5 text-base border-gray-200 hover:border-gray-300 hover:bg-white/70"
              >
                <Link
                  href="#features"
                  className="inline-flex items-center gap-2 text-gray-700"
                >
                  See how it works
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-sm ring-1 ring-gray-100">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  OAuth with Clerk
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-sm ring-1 ring-gray-100">
                  <Clock3 className="h-4 w-4 text-indigo-600" />
                  Built for daily review
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 text-sm text-gray-700">
              {[
                {
                  label: "Capture from anywhere",
                  value: "Links • Twitter • Instagram • Email",
                },
                {
                  label: "AI distillation",
                  value: "Summaries, tags, domains, previews",
                },
                {
                  label: "Progress that sticks",
                  value: "XP, streaks, badges, focus areas",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-gray-100 backdrop-blur animate-fade-up"
                >
                  <p className="text-xs uppercase tracking-[0.08em] text-gray-500">
                    {item.label}
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-cyan-400/10 to-emerald-400/10 blur-2xl animate-glow" />
            <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl shadow-indigo-100/60 backdrop-blur">
              <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white grid place-items-center font-semibold">
                    CH
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Today Inbox
                    </p>
                    <p className="text-xs text-gray-500">AI summaries ready</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  +40 XP
                </span>
              </div>
              <div className="space-y-4 p-5">
                {[
                  {
                    title: "Figma auto layout tips from @sarahdesign",
                    summary:
                      "5 rules to ship faster UI with constraints, spacing, and tokens.",
                    tags: ["design", "productivity"],
                  },
                  {
                    title: "Naval on compounding knowledge",
                    summary:
                      "Curate inputs → reflect daily → level up your domain XP.",
                    tags: ["philosophy", "learning"],
                  },
                  {
                    title: "AI tools for builders",
                    summary:
                      "Prompt packs, API starters, and code review workflows.",
                    tags: ["tech", "ai"],
                  },
                ].map((card, idx) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 shadow-inner"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {card.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {card.summary}
                        </p>
                      </div>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                        New
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 ring-1 ring-gray-100"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white/80">
                      Progress
                    </p>
                    <LineChart className="h-5 w-5" />
                  </div>
                  <p className="mt-2 text-lg font-bold">Level 7 • 1,950 XP</p>
                  <div className="mt-3 h-2 w-full rounded-full bg-white/20">
                    <div
                      className="h-2 rounded-full bg-white/90"
                      style={{ width: "62%" }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-white/80">
                    Daily streak active • +10 XP
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
