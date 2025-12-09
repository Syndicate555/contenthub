const integrations = [
  { name: "Twitter / X", color: "bg-black text-white", badge: "Bookmarks" },
  {
    name: "Instagram",
    color:
      "bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 text-white",
    badge: "Reels & posts",
  },
  { name: "LinkedIn", color: "bg-blue-600 text-white", badge: "Feed posts" },
  { name: "Email", color: "bg-emerald-600 text-white", badge: "Newsletters" },
  { name: "Web links", color: "bg-slate-800 text-white", badge: "Any URL" },
];

export function Integrations() {
  return (
    <section className="pb-16 pt-6 sm:pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-100 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-indigo-200">
                Integrations
              </p>
              <h3 className="text-2xl font-bold text-white">
                Designed for the feeds you actually use.
              </h3>
              <p className="text-sm text-slate-300">
                One inbox for social links, reels, tweets, and newsletters. AI
                handles the rest.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/10">
              API-ready • Secure by default
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-inner shadow-black/20"
              >
                <div
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${integration.color}`}
                >
                  {integration.name}
                </div>
                <p className="mt-3 text-sm text-slate-200">
                  {integration.badge}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
