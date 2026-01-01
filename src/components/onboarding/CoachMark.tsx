"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

type CoachMarkAction = {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
  disabled?: boolean;
};

type CoachMarkPlacement = "auto" | "left" | "right" | "top" | "bottom";

interface CoachMarkProps {
  targetSelector: string;
  title: string;
  description: string;
  step?: number;
  totalSteps?: number;
  primaryAction?: CoachMarkAction;
  secondaryAction?: CoachMarkAction;
  placement?: CoachMarkPlacement;
  offset?: number;
}

const TOOLTIP_WIDTH = 360;
const TOOLTIP_HEIGHT = 180;
const PADDING = 4;
const DEFAULT_OFFSET = 16;
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
  placement = "auto",
  offset = DEFAULT_OFFSET,
}: CoachMarkProps) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetRadius, setTargetRadius] = useState<number | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateRect = () => {
      const element = document.querySelector(targetSelector) as HTMLElement | null;
      if (!element) {
        if (targetRef.current) {
          targetRef.current.classList.remove("coachmark-focus");
          targetRef.current = null;
        }
        setTargetRect(null);
        setTargetRadius(null);
        return;
      }
      if (targetRef.current && targetRef.current !== element) {
        targetRef.current.classList.remove("coachmark-focus");
      }
      if (targetRef.current !== element) {
        element.classList.add("coachmark-focus");
        targetRef.current = element;
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
      if (targetRef.current) {
        targetRef.current.classList.remove("coachmark-focus");
        targetRef.current = null;
      }
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
    const baseTooltipWidth = Math.min(
      TOOLTIP_WIDTH,
      viewportWidth - VIEWPORT_MARGIN * 2
    );
    const tooltipHeight = TOOLTIP_HEIGHT;

    const highlight = {
      top: targetRect.top - PADDING,
      left: targetRect.left - PADDING,
      width: targetRect.width + PADDING * 2,
      height: targetRect.height + PADDING * 2,
    };

    const centerX = highlight.left + highlight.width / 2;
    const centerY = highlight.top + highlight.height / 2;
    const leftSpace = highlight.left - offset - VIEWPORT_MARGIN;
    const rightSpace =
      viewportWidth - highlight.left - highlight.width - offset - VIEWPORT_MARGIN;
    const leftWidth = Math.min(baseTooltipWidth, Math.max(240, leftSpace));
    const rightWidth = Math.min(baseTooltipWidth, Math.max(240, rightSpace));

    const placeBottom = (width: number) => ({
      left: clamp(
        centerX - width / 2,
        VIEWPORT_MARGIN,
        viewportWidth - width - VIEWPORT_MARGIN
      ),
      top: highlight.top + highlight.height + offset,
      fits:
        highlight.top + highlight.height + offset + tooltipHeight <=
        viewportHeight - VIEWPORT_MARGIN,
      width,
    });

    const placeTop = (width: number) => ({
      left: clamp(
        centerX - width / 2,
        VIEWPORT_MARGIN,
        viewportWidth - width - VIEWPORT_MARGIN
      ),
      top: highlight.top - tooltipHeight - offset,
      fits: highlight.top - tooltipHeight - offset >= VIEWPORT_MARGIN,
      width,
    });

    const placeLeft = (width: number) => ({
      left: highlight.left - width - offset,
      top: clamp(
        centerY - tooltipHeight / 2,
        VIEWPORT_MARGIN,
        viewportHeight - tooltipHeight - VIEWPORT_MARGIN
      ),
      fits: highlight.left - width - offset >= VIEWPORT_MARGIN,
      width,
    });

    const placeRight = (width: number) => ({
      left: highlight.left + highlight.width + offset,
      top: clamp(
        centerY - tooltipHeight / 2,
        VIEWPORT_MARGIN,
        viewportHeight - tooltipHeight - VIEWPORT_MARGIN
      ),
      fits:
        highlight.left + highlight.width + offset + width <=
        viewportWidth - VIEWPORT_MARGIN,
      width,
    });

    const pickPlacement = () => {
      const placements = {
        left: placeLeft,
        right: placeRight,
        top: placeTop,
        bottom: placeBottom,
      };

      if (placement !== "auto") {
        const forcedWidth =
          placement === "left"
            ? leftWidth
            : placement === "right"
              ? rightWidth
              : baseTooltipWidth;
        return placements[placement](forcedWidth);
      }

      const candidateOrder = [
        () => placeBottom(baseTooltipWidth),
        () => placeRight(rightWidth),
        () => placeLeft(leftWidth),
        () => placeTop(baseTooltipWidth),
      ];
      for (const candidate of candidateOrder) {
        const result = candidate();
        if (result.fits) return result;
      }
      return placeBottom(baseTooltipWidth);
    };

    const tooltip = pickPlacement();

    return {
      highlight,
      radius: targetRadius !== null ? targetRadius + PADDING : 16,
      viewport: { width: viewportWidth, height: viewportHeight },
      tooltip: {
        top: clamp(
          tooltip.top,
          VIEWPORT_MARGIN,
          viewportHeight - tooltipHeight - VIEWPORT_MARGIN
        ),
        left: clamp(
          tooltip.left,
          VIEWPORT_MARGIN,
          viewportWidth - tooltip.width - VIEWPORT_MARGIN
        ),
        width: tooltip.width,
      },
    };
  }, [targetRect, targetRadius, placement, offset]);

  if (!layout || !portalTarget) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] pointer-events-none">
      <div
        className="absolute left-0 top-0 w-full bg-black/55"
        style={{ height: Math.max(0, layout.highlight.top) }}
      />
      <div
        className="absolute left-0 bg-black/55"
        style={{
          top: layout.highlight.top,
          height: layout.highlight.height,
          width: Math.max(0, layout.highlight.left),
        }}
      />
      <div
        className="absolute right-0 bg-black/55"
        style={{
          top: layout.highlight.top,
          height: layout.highlight.height,
          width: Math.max(
            0,
            layout.viewport.width -
              (layout.highlight.left + layout.highlight.width)
          ),
        }}
      />
      <div
        className="absolute left-0 w-full bg-black/55"
        style={{
          top: layout.highlight.top + layout.highlight.height,
          height: Math.max(
            0,
            layout.viewport.height -
              (layout.highlight.top + layout.highlight.height)
          ),
        }}
      />

      <div
        className="absolute border border-white/70 shadow-[0_0_26px_rgba(91,91,255,0.45),0_0_12px_rgba(255,255,255,0.25)] transition-all"
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
