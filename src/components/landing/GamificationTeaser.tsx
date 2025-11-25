import { Flame, Trophy, Medal, Sparkles } from "lucide-react";

export function GamificationTeaser() {
  const badges = [
    { icon: "🌱", name: "First Steps", rarity: "Common" },
    { icon: "🔥", name: "Habit Former", rarity: "Common" },
    { icon: "🎯", name: "Domain Specialist", rarity: "Rare" },
  ];

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-1 shadow-xl">
          <div className="grid gap-6 rounded-[22px] bg-white/90 p-6 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
                <Sparkles className="h-4 w-4" />
                Motivation that sticks
              </div>
              <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Turn your reading habit into XP, streaks, and badges.
              </h3>
              <p className="text-gray-600">
                Every save and review moves you forward. Domains track your specialties, streaks keep
                you consistent, and badges celebrate milestones.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-gray-50/80 p-4 shadow-inner">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-900">Overall XP</span>
                    <span className="text-gray-600">Level 7</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-200">
                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: "68%" }} />
                  </div>
                  <p className="mt-2 text-xs text-gray-600">1,950 / 2,850 XP to next level</p>
                </div>
                <div className="rounded-2xl bg-gray-50/80 p-4 shadow-inner">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-900">Today streak</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
                      <Flame className="h-3.5 w-3.5" />
                      Active
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900">6 days</p>
                  <p className="text-xs text-gray-600">Don&apos;t break the chain—earn +10 XP daily.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Domains</p>
                    <p className="text-xs text-gray-500">Focus on what matters most</p>
                  </div>
                  <Medal className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="mt-3 space-y-2 text-sm text-gray-800">
                  <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-3 py-2">
                    <span className="font-semibold text-indigo-900">Technology</span>
                    <span className="text-xs font-semibold text-indigo-800">Level 6</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
                    <span className="font-semibold text-emerald-900">Productivity</span>
                    <span className="text-xs font-semibold text-emerald-800">Level 4</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2">
                    <span className="font-semibold text-amber-900">Design</span>
                    <span className="text-xs font-semibold text-amber-800">Level 3</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Badges</p>
                    <p className="text-xs text-gray-500">Celebrate milestones</p>
                  </div>
                  <Trophy className="h-5 w-5 text-amber-500" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <span
                      key={badge.name}
                      className="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800 ring-1 ring-gray-100"
                    >
                      <span className="text-lg">{badge.icon}</span>
                      <span>{badge.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
