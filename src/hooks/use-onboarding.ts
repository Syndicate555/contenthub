"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";

export type OnboardingStage =
  | "welcome"
  | "start"
  | "add-url"
  | "add-submit"
  | "submitted"
  | "done";

const STORAGE_PREFIX = "tavlo:onboarding:add-post";

const isValidStage = (value: string | null): value is OnboardingStage => {
  if (!value) return false;
  return (
    value === "welcome" ||
    value === "start" ||
    value === "add-url" ||
    value === "add-submit" ||
    value === "submitted" ||
    value === "done"
  );
};

export function useOnboarding() {
  const { userId, isLoaded } = useAuth();
  const [stage, setStageState] = useState<OnboardingStage | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoaded || !userId || typeof window === "undefined") return;
    const key = `${STORAGE_PREFIX}:${userId}`;
    const stored = window.localStorage.getItem(key);
    setStageState(isValidStage(stored) ? stored : null);
    setIsReady(true);
  }, [isLoaded, userId]);

  const setStage = useCallback(
    (next: OnboardingStage) => {
      if (!userId || typeof window === "undefined") return;
      const key = `${STORAGE_PREFIX}:${userId}`;
      window.localStorage.setItem(key, next);
      setStageState(next);
    },
    [userId]
  );

  const clearStage = useCallback(() => {
    if (!userId || typeof window === "undefined") return;
    const key = `${STORAGE_PREFIX}:${userId}`;
    window.localStorage.removeItem(key);
    setStageState(null);
  }, [userId]);

  return {
    stage,
    setStage,
    clearStage,
    isReady,
    userId,
    isLoaded,
  };
}
