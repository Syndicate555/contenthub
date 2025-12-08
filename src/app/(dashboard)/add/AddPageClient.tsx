"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Link as LinkIcon, Mail, Copy, Check } from "lucide-react";
import { showMultipleBadgesNotification } from "@/components/badge-notification";
interface AddPageClientProps {
  userId: string;
  inboundEmail: string;
}

export default function AddPageClient({ userId, inboundEmail }: AddPageClientProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

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
      toast.error(error instanceof Error ? error.message : "Failed to save item");
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
    <div className="max-w-xl mx-auto space-y-6">
      <Card>
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
                Paste a link from Twitter, Instagram, LinkedIn, or any webpage
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                placeholder="Why did you save this? Any personal context..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Save & Process"
              )}
            </Button>

            {isSubmitting && (
              <p className="text-xs text-center text-gray-500">
                Fetching content and generating summary. This may take a few seconds...
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Email Newsletter Forwarding Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Forward Newsletters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            Forward email newsletters to your personalized address to automatically save and summarize them:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 text-sm bg-gray-100 rounded-md border border-gray-200 select-all font-mono">
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
            Newsletters are automatically processed with AI summaries, tags, and categorization
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
