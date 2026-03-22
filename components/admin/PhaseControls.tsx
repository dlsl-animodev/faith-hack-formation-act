"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";

interface PhaseControlsProps {
  adminSecret: string;
}

export function PhaseControls({ adminSecret }: PhaseControlsProps) {
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (action: "advance" | "endSharing") => {
      setBusy(true);
      try {
        const res = await fetch("/api/admin/phase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-secret": adminSecret,
          },
          body: JSON.stringify({ action }),
        });
        const data: unknown = await res.json();
        if (
          typeof data === "object" &&
          data &&
          "success" in data &&
          !(data as { success: boolean }).success
        ) {
          const err =
            "error" in data && typeof (data as { error: unknown }).error === "string"
              ? (data as { error: string }).error
              : "Phase update failed";
          console.warn("[faith-hack]", err);
        }
      } finally {
        setBusy(false);
      }
    },
    [adminSecret]
  );

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        onClick={() => void run("advance")}
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
