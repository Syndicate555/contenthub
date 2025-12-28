"use client";

/**
 * Inactivity Warning Modal
 * Shows a warning 2 minutes before auto-logout with countdown timer
 * Allows user to extend session or sign out immediately
 */

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type InactivityWarningModalProps = {
  isOpen: boolean;
  onStaySignedIn: () => void;
  onSignOut: () => void;
};

const WARNING_DURATION_SECONDS = 120; // 2 minutes

export function InactivityWarningModal({
  isOpen,
  onStaySignedIn,
  onSignOut,
}: InactivityWarningModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(
    WARNING_DURATION_SECONDS,
  );

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(WARNING_DURATION_SECONDS);
      return;
    }

    // Countdown timer
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onSignOut(); // Auto-logout when countdown reaches 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onSignOut]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onStaySignedIn()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Still there?</DialogTitle>
          <DialogDescription>
            You&apos;ve been inactive for a while. For your security,
            you&apos;ll be automatically signed out in:
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-foreground">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {minutes > 0
                ? `${minutes} minute${minutes !== 1 ? "s" : ""} ${seconds} second${seconds !== 1 ? "s" : ""}`
                : `${seconds} second${seconds !== 1 ? "s" : ""}`}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={onSignOut}
            className="w-full sm:w-auto"
          >
            Sign Out Now
          </Button>
          <Button onClick={onStaySignedIn} className="w-full sm:w-auto">
            Stay Signed In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
