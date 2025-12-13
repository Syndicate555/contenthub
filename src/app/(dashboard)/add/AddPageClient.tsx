"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Loader2,
  Link as LinkIcon,
  Mail,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  Activity,
  Globe2,
  Twitter,
  Instagram,
  Linkedin,
  Image as ImageIcon,
  MessageSquarePlus,
  Send,
  Video,
} from "lucide-react";
import { showMultipleBadgesNotification } from "@/components/badge-notification";

interface AddPageClientProps {
  userId: string;
  inboundEmail: string;
}

// Framer Motion variants for animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function AddPageClient({ inboundEmail }: AddPageClientProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Friendly progress narrative
  const steps = useMemo(
    () => [
      { title: "Validating link", detail: "Checking URL and platform." },
      {
        title: "Fetching content",
        detail: "Pulling text, media, and metadata.",
      },
      { title: "AI distilling", detail: "Summarizing key takeaways." },
      { title: "Tagging & routing", detail: "Applying tags, domains, and XP." },
      { title: "Finalizing", detail: "Saving to Inbox and polishing UI." },
    ],
    [],
  );

  const quotes = [
    "“Great things are done by a series of small steps.”",
    "Distilling insights… brewing something tasty ☕",
    "Agents at work: fetching, cleaning, summarizing.",
    "Making it tidy so future-you smiles.",
    "Almost there—aligning tags and XP bonuses!",
  ];

  const platformHint = useMemo(() => {
    const lower = url.toLowerCase();
    if (lower.includes("twitter.com") || lower.includes("x.com")) {
      return {
        label: "Twitter",
        color: "bg-sky-100 text-sky-800 border-sky-200",
        Icon: Twitter,
      };
    }
    if (lower.includes("instagram.com")) {
      return {
        label: "Instagram",
        color: "bg-pink-100 text-pink-800 border-pink-200",
        Icon: Instagram,
      };
    }
    if (lower.includes("linkedin.com")) {
      return {
        label: "LinkedIn",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        Icon: Linkedin,
      };
    }
    if (lower.includes("pinterest.com")) {
      return {
        label: "Pinterest",
        color: "bg-red-100 text-red-800 border-red-200",
        Icon: ImageIcon,
      };
    }
    if (lower.includes("tiktok.com")) {
      return {
        label: "TikTok",
        color: "bg-slate-100 text-slate-900 border-slate-300",
        Icon: Video,
      };
    }
    return {
      label: "Web",
      color: "bg-amber-100 text-amber-800 border-amber-200",
      Icon: Globe2,
    };
  }, [url]);

  // Simulated progress timeline so users see activity while the server works
  useEffect(() => {
    if (!isSubmitting) {
      setProgressStep(0);
      return;
    }

    setProgressStep(0);
    const timers: NodeJS.Timeout[] = [];
    steps.forEach((_, idx) => {
      // spread progress across ~10 seconds
      timers.push(
        setTimeout(() => setProgressStep((s) => Math.max(s, idx)), 1800 * idx),
      );
    });

    const quoteTimer = setInterval(
      () => setQuoteIndex((i) => (i + 1) % quotes.length),
      2200,
    );

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(quoteTimer);
    };
  }, [isSubmitting, steps, quotes.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(url.trim());
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          note: note.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to save item");
      }

      // Show badge notifications if any badges were earned
      if (data.newBadges && data.newBadges.length > 0) {
        showMultipleBadgesNotification(data.newBadges);
      }

      toast.success("Item saved and processed!");
      router.push("/today");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save item",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(inboundEmail);
      setEmailCopied(true);
      toast.success("Email address copied!");
      setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      toast.error("Failed to copy email");
    }
  };

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-slate-50 via-white to-indigo-50/60 overflow-x-hidden">
      <motion.div
        className="max-w-5xl mx-auto py-8 px-4 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero banner */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm p-6"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-10 -top-16 h-48 w-48 rounded-full bg-indigo-100 blur-3xl" />
            <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-pink-100 blur-3xl" />
            <div className="absolute left-1/3 bottom-0 h-24 w-24 rounded-full bg-amber-100 blur-2xl" />
          </div>
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-500 font-semibold">
                Add any link
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                Drop a link, we distill the signal.
              </h1>
              <p className="text-sm text-slate-600 max-w-2xl">
                Automatic extraction, AI summarization, tagging, and inbox
                routing. Watch the pipeline in action with live progress and
                playful cues.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-full bg-white/70 border border-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> AI Powered
              </span>
              <span className="rounded-full bg-white/70 border border-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm flex items-center gap-1">
                <Check className="w-4 h-4" /> Auto-tagged
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Add Content form + progress */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-md border-slate-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Add Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://twitter.com/..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={isSubmitting}
                      autoFocus
                    />
                    <p className="text-xs text-gray-500">
                      Paste a link from Twitter, Instagram, LinkedIn, TikTok, or
                      any webpage
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note" className="flex items-center gap-2">
                      <MessageSquarePlus className="w-4 h-4 text-slate-500" />
                      Note (optional)
                    </Label>
                    <Textarea
                      id="note"
                      placeholder="Why did you save this? Any personal context..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      disabled={isSubmitting}
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full flex items-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Working magic...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Save & Process
                      </>
                    )}
                  </Button>

                  {isSubmitting && (
                    <div className="space-y-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4 shadow-lg overflow-hidden relative">
                      {/* Floating shapes background */}
                      <div className="pointer-events-none absolute inset-0">
                        <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-indigo-200/30 blur-2xl animate-pulse" />
                        <div className="absolute -right-4 top-10 h-16 w-16 rounded-full bg-pink-200/40 blur-xl animate-[pulse_3s_ease-in-out_infinite]" />
                        <div className="absolute left-1/3 bottom-0 h-12 w-12 rounded-full bg-amber-200/30 blur-lg animate-[pulse_2.6s_ease-in-out_infinite]" />
                      </div>

                      <div className="flex items-center justify-between gap-2 relative">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm font-medium text-slate-800">
                            Processing your link
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${platformHint.color}`}
                        >
                          {platformHint.Icon && (
                            <platformHint.Icon className="w-3.5 h-3.5" />
                          )}
                          {platformHint.label}
                        </span>
                      </div>

                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 shadow-inner">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700"
                          style={{
                            width: `${(progressStep / (steps.length - 1)) * 100}%`,
                          }}
                        />
                        <div className="absolute inset-0 animate-[pulse_2s_ease-in-out_infinite] bg-white/10" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 relative">
                        {steps.map((step, idx) => {
                          const isActive = idx === progressStep;
                          const isDone = idx < progressStep;
                          return (
                            <div
                              key={step.title}
                              className={`flex items-start gap-2 rounded-lg border p-2 text-sm transition shadow-sm ${
                                isDone
                                  ? "border-green-200 bg-green-50 text-green-800"
                                  : isActive
                                    ? "border-indigo-200 bg-white text-indigo-900 shadow-md"
                                    : "border-slate-200 bg-white/70 text-slate-600"
                              }`}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                              ) : isActive ? (
                                <Loader2 className="w-4 h-4 mt-0.5 text-indigo-500 animate-spin shrink-0" />
                              ) : (
                                <div className="w-4 h-4 mt-0.5 rounded-full border border-slate-300 shrink-0" />
                              )}
                              <div>
                                <p className="font-medium">{step.title}</p>
                                <p className="text-xs">{step.detail}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 relative">
                        <div className="flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-slate-400" />
                          <span>{quotes[quoteIndex]}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          AI working…
                        </span>
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* How it works / info */}
          <motion.div variants={itemVariants} className="space-y-4">
            <Card className="shadow-md border-slate-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  How this works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      Smart extraction
                    </p>
                    <p className="text-xs text-slate-600">
                      We fetch text, media, and metadata from the link so you
                      don’t have to copy-paste.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-8 w-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">AI enrichment</p>
                    <p className="text-xs text-slate-600">
                      Summaries, tags, categories, and XP are generated to keep
                      your inbox organized.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Ready to act</p>
                    <p className="text-xs text-slate-600">
                      Content drops into your Inbox with focus areas, badges,
                      and actions ready to go.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-3 py-1 text-xs rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Summaries
                  </span>
                  <span className="px-3 py-1 text-xs rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                    Tags
                  </span>
                  <span className="px-3 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Domains
                  </span>
                  <span className="px-3 py-1 text-xs rounded-full bg-pink-50 text-pink-700 border border-pink-100">
                    XP
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Email Newsletter Forwarding Section */}
            <Card className="shadow-md border-slate-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Forward Newsletters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Forward email newsletters to your personalized address to
                  automatically save and summarize them:
                </p>
                <div className="flex items-center gap-2 w-full">
                  <code className="flex-1 min-w-0 px-3 py-2 text-sm bg-gray-100 rounded-md border border-gray-200 select-all font-mono break-all">
                    {inboundEmail}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyEmail}
                    className="shrink-0"
                  >
                    {emailCopied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Newsletters are automatically processed with AI summaries,
                  tags, and categorization
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
