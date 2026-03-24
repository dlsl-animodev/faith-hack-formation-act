"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface PhaseControlsProps {
  adminSecret: string;
  onPhaseUpdate?: () => void | Promise<void>;
}

export function PhaseControls({ adminSecret, onPhaseUpdate }: PhaseControlsProps) {
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (action: "advance" | "endSharing") => {
      setBusy(true);
      try {
        console.log("[PhaseControls] Calling /api/admin/phase with action:", action);
        const res = await fetch("/api/admin/phase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-secret": adminSecret,
          },
          body: JSON.stringify({ action }),
        });
        console.log("[PhaseControls] Phase update response status:", res.status);
        const data: unknown = await res.json();
        console.log("[PhaseControls] Phase update response:", data);
        
        if (
          typeof data === "object" &&
          data &&
          "success" in data &&
          (data as { success: boolean }).success
        ) {
          console.log("[PhaseControls] Phase updated successfully, calling onPhaseUpdate callback");
          if (onPhaseUpdate) {
            await onPhaseUpdate();
          }
        } else {
          const err = isErrorString(data)
            ? (data as { error: string }).error
            : "Phase update failed";
          console.warn("[faith-hack]", err);
        }
      } finally {
        setBusy(false);
      }
    },
    [adminSecret, onPhaseUpdate]
  );

  const router = useRouter();

  const handleAdvancePhase = async () => {
    await run("advance");
    router.refresh(); // Ensure fresh data is fetched
  };

  const isErrorString = (data: unknown): data is { error: string } => {
    if (typeof data === "object" && data !== null) {
      return typeof (data as { error?: unknown }).error === "string";
    }
    return false;
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        onClick={handleAdvancePhase}
      >
        Advance phase
      </Button>
      <Button
        type="button"
        variant="warm"
        disabled={busy}
        onClick={() => void run("endSharing")}
      >
        End sharing → Phase 4
      </Button>
    </div>
  );
}
