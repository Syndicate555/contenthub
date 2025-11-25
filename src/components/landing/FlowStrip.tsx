import { ArrowRight, PenLine, BrainCircuit, ListCheck } from "lucide-react";

export function FlowStrip() {
  const steps = [
    {
      title: "Save",
      icon: PenLine,
      detail: "Add links, sync Twitter bookmarks, or forward newsletters.",
    },
    {
      title: "Summarize",
      icon: BrainCircuit,
      detail: "AI extracts, summarizes, tags, and maps to domains automatically.",
    },
    {
      title: "Decide",
      icon: ListCheck,
      detail: "Review in Today, Pin what matters, Archive the rest, keep streaks alive.",
    },
  ];

  return (
    <section className="py-14 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-100 bg-gradient-to-r from-slate-50 to-white p-6 shadow-sm">
          <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                    <p className="text-xs text-gray-600">{step.detail}</p>
                  </div>
                </div>
              );
            }).flatMap((node, index) =>
              index < steps.length - 1
                ? [
                    node,
                    <div
                      key={`arrow-${index}`}
                      className="hidden sm:flex h-full items-center justify-center text-gray-400"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </div>,
                  ]
                : [node]
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
