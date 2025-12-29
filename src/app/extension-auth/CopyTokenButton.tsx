"use client";

import React, { useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyTokenButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy token:", error);
    }
  };

  return (
    <Button
      onClick={handleCopy}
      className="w-full bg-gradient-to-r from-brand-1 to-brand-2 text-white gap-2"
    >
      {copied ? (
        <>
          <CheckCircle2 className="w-4 h-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copy Token
        </>
      )}
    </Button>
  );
}
