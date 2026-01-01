"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

type CoachMarkAction = {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
  disabled?: boolean;
};

interface CoachMarkProps {
  targetSelector: string;
  title: string;
  description: string;
  step?: number;
  totalSteps?: number;
  primaryAction?: CoachMarkAction;
  secondaryAction?: CoachMarkAction;
}

const TOOLTIP_WIDTH = 360;
const TOOLTIP_HEIGHT = 180;
const PADDING = 4;
const VIEWPORT_MARGIN = 16;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const CoachMark = ({
  targetSelector,
  title,
  description,
  step,
  totalSteps,
  primaryAction,
  secondaryAction,
}: CoachMarkProps) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetRadius, setTargetRadius] = useState<number | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateRect = () => {
      const element = document.querySelector(targetSelector) as HTMLElement | null;
      if (!element) {
        setTargetRect(null);
        setTargetRadius(null);
        return;
      }
      setTargetRect(element.getBoundingClientRect());
      const radiusValue = window.getComputedStyle(element).borderRadius;
      const radius = Number.parseFloat(radiusValue || "0");
      setTargetRadius(Number.isFinite(radius) ? radius : null);
    };

    updateRect();

    let rafId: number;
    let start = performance.now();
    const tick = (now: number) => {
      updateRect();
      if (now - start < 900) {
        rafId = window.requestAnimationFrame(tick);
      }
    };
    rafId = window.requestAnimationFrame(tick);

    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);

    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
      window.cancelAnimationFrame(rafId);
    };
  }, [targetSelector]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPortalTarget(window.document.body);
  }, []);

  const layout = useMemo(() => {
    if (!targetRect || typeof window === "undefined") return null;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = Math.min(TOOLTIP_WIDTH, viewportWidth - VIEWPORT_MARGIN * 2);
    const tooltipHeight = TOOLTIP_HEIGHT;

    const highlight = {
      top: targetRect.top - PADDING,
      left: targetRect.left - PADDING,
      width: targetRect.width + PADDING * 2,
      height: targetRect.height + PADDING * 2,
    };

    const spaceBelow = viewportHeight - (highlight.top + highlight.height);
    const placeBelow = spaceBelow > tooltipHeight + 24;
    const tooltipTop = placeBelow
      ? highlight.top + highlight.height + 12
      : Math.max(VIEWPORT_MARGIN, highlight.top - tooltipHeight - 12);
    const tooltipLeft = clamp(
      highlight.left + highlight.width / 2 - tooltipWidth / 2,
      VIEWPORT_MARGIN,
      viewportWidth - tooltipWidth - VIEWPORT_MARGIN
    );

    return {
      highlight,
      radius: targetRadius !== null ? targetRadius + PADDING : 16,
      tooltip: {
        top: tooltipTop,
        left: tooltipLeft,
        width: tooltipWidth,
      },
    };
  }, [targetRect, targetRadius]);

  if (!layout || !portalTarget) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] pointer-events-none">
      <div
        className="absolute border border-white/60 shadow-[0_0_0_9999px_rgba(8,10,20,0.55)] backdrop-blur-[1px] transition-all"
        style={{
          top: layout.highlight.top,
          left: layout.highlight.left,
          width: layout.highlight.width,
          height: layout.highlight.height,
          borderRadius: layout.radius,
        }}
      />

      <div
        className="absolute pointer-events-auto rounded-2xl border border-border bg-card shadow-xl p-4"
        style={{
          top: layout.tooltip.top,
          left: layout.tooltip.left,
          width: layout.tooltip.width,
        }}
        role="dialog"
        aria-live="polite"
      >
        {step && totalSteps ? (
          <p className="text-xs text-muted-foreground mb-2">
            Step {step} of {totalSteps}
          </p>
        ) : null}
        <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {secondaryAction ? (
            <Button
              variant={secondaryAction.variant ?? "outline"}
              size="sm"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
            >
              {secondaryAction.label}
            </Button>
          ) : null}
          {primaryAction ? (
            <Button
              variant={primaryAction.variant ?? "default"}
              size="sm"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
            >
              {primaryAction.label}
            </Button>
          ) : null}
        </div>
      </div>
    </div>,
    portalTarget
  );
};

export default CoachMark;
