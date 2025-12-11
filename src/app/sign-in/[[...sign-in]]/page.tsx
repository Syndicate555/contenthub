import { SignIn } from "@clerk/nextjs";
import { Sora } from "next/font/google";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Gauge,
  BotMessageSquare,
} from "lucide-react";

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export default function SignInPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-80 w-[120%] rounded-full bg-gradient-to-r from-indigo-100 via-cyan-50 to-emerald-100 blur-3xl" />
      <div className="pointer-events-none absolute right-10 top-10 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-200 to-blue-100 blur-2xl opacity-70 animate-float-slow" />
      <div className="pointer-events-none absolute left-0 bottom-0 h-60 w-60 rounded-full bg-gradient-to-br from-emerald-200 to-cyan-100 blur-2xl opacity-70 animate-float-slow" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Welcome back to Tavlo
            </div>
            <h1
              className={`${sora.className} text-4xl leading-tight tracking-tight text-gray-900 sm:text-5xl`}
            >
              Your daily inbox for <br className="hidden sm:block" />
              distilled social content.
            </h1>
            <p className="max-w-2xl text-lg text-gray-600">
              Pick up where you left off. AI summaries, domain XP, and streaks
              are ready the moment you land.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: BotMessageSquare,
                  title: "AI distillation",
                  desc: "Summaries, tags, and domains auto-assigned.",
                },
                {
                  icon: Gauge,
                  title: "Today view",
                  desc: "Pin, archive, or delete in one focused flow.",
                },
                {
                  icon: ShieldCheck,
                  title: "Secure by design",
                  desc: "Clerk auth + encrypted tokens.",
                },
                {
                  icon: Zap,
                  title: "Fast navigation",
                  desc: "Prefetching and SWR caching built-in.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm backdrop-blur animate-fade-up"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {title}
                    </p>
                    <p className="text-xs text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 -top-8 h-32 rounded-full bg-linear-to-r from-indigo-200/50 via-blue-200/40 to-cyan-200/40 blur-3xl" />
            <div className="relative mx-auto w-full max-w-md">
              <SignIn
                appearance={{
                  variables: {
                    colorPrimary: "#4338ca",
                    colorBackground: "rgba(255,255,255,0.94)",
                    colorInputBackground: "#f8fafc",
                    colorInputText: "#0f172a",
                    colorText: "#0f172a",
                    colorNeutral: "#000000",
                    borderRadius: "16px",
                    spacingUnit: "10px",
                    fontFamily: "var(--font-geist-sans)",
                  },
                  layout: {
                    socialButtonsPlacement: "bottom",
                    socialButtonsVariant: "blockButton",
                  },
                  elements: {
                    rootBox: "w-full",
                    card: "w-full shadow-none border-0 bg-white/90 backdrop-blur rounded-2xl ring-1 ring-gray-100 p-6",
                    headerTitle: "text-base font-semibold text-gray-900",
                    headerSubtitle: "text-sm text-gray-600",
                    formFieldLabel: "hidden",
                    formFieldInput:
                      "bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                    socialButtonsBlockButton:
                      "border border-gray-200 bg-white text-gray-900 hover:border-indigo-200 hover:bg-indigo-50 shadow-sm text-base font-semibold",
                    socialButtonsBlockButton__google:
                      "bg-white text-gray-900 border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 shadow-sm text-base font-semibold",
                    socialButtonsBlockButtonText: "text-gray-900 font-semibold",
                    socialButtonsBlockButtonIcon: "text-gray-900",
                    formButtonPrimary:
                      "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-lg hover:shadow-indigo-200",
                    footer: "hidden",
                    footerAction: "hidden",
                    footerActionText: "hidden",
                    footerActionLink: "hidden",
                    identityPreviewEditButton: "hidden",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
