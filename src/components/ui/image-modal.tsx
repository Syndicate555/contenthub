"use client";

import { useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut, ExternalLink } from "lucide-react";
import { Button } from "./button";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
  sourceUrl?: string;
}

export function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  alt,
  sourceUrl,
}: ImageModalProps) {
  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      {/* Content */}
      <div
        className="relative z-10 max-w-[95vw] max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Controls */}
        <div className="flex items-center justify-end gap-2 mb-3">
          {sourceUrl && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/10 text-white hover:bg-white/20 border-0"
              onClick={() => window.open(sourceUrl, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Original
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/10 text-white hover:bg-white/20 border-0"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Image */}
        <div className="relative overflow-auto rounded-lg">
          <img
            src={imageUrl}
            alt={alt || "Full size image"}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            style={{ margin: "0 auto" }}
          />
        </div>

        {/* Caption */}
        {alt && (
          <p className="text-center text-white/70 text-sm mt-3 max-w-lg mx-auto">
            {alt}
          </p>
        )}
      </div>

      {/* Close hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm">
        Press{" "}
        <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">ESC</kbd> or
        click outside to close
      </div>
    </div>
  );
}

export default ImageModal;
