import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 p-1 shadow-xl">
          <div className="flex flex-col gap-6 rounded-[22px] bg-white px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-indigo-600">
                Ready when you are
              </p>
              <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Start your daily review in minutes.
              </h3>
              <p className="text-gray-600">
                Sign in with Google, drop your first links, and watch ContentHub do the heavy lifting.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                OAuth secured by Clerk • Token encryption by default
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <Button asChild size="lg" className="shadow-lg shadow-indigo-200">
                <Link href="/sign-in" className="inline-flex items-center gap-2">
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="text-xs text-gray-500">No onboarding friction. Straight to your Today feed.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
