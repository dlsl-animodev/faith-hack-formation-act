"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function JoinEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventCode = typeof params.eventCode === "string" ? params.eventCode : "";
  const [status, setStatus] = useState<"checking" | "invalid" | "ready" | "joining">("checking");
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(async () => {
    if (!eventCode) {
      setStatus("invalid");
      return;
    }
    setStatus("checking");
    try {
      const res = await fetch(`/api/events/validate/${encodeURIComponent(eventCode)}`);
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data &&
        "success" in data &&
        (data as { success: boolean }).success &&
        "data" in data
      ) {
        const d = (data as { data: { valid: boolean } }).data;
        setStatus(d.valid ? "ready" : "invalid");
        return;
      }
      setStatus("invalid");
    } catch {
      setStatus("invalid");
    }
  }, [eventCode]);

  useEffect(() => {
    void validate();
  }, [validate]);

  const join = async () => {
    setStatus("joining");
    setError(null);
    try {
      const res = await fetch("/api/session/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventCode }),
      });
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data &&
        "success" in data &&
        (data as { success: boolean }).success &&
        "data" in data
      ) {
        const d = (data as { data: { sessionId: string } }).data;
        if (typeof window !== "undefined") {
          window.localStorage.setItem("fh_session_id", d.sessionId);
          window.localStorage.setItem("fh_event_code", eventCode);
        }
        router.replace(`/participant/${d.sessionId}`);
        return;
      }
      const err =
        typeof data === "object" &&
        data &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Could not join";
      setError(err);
      setStatus("ready");
    } catch {
      setError("Network error");
      setStatus("ready");
    }
  };

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] font-mono text-sm text-[var(--text-secondary)]">
        validating_event
        <span className="ml-1 animate-cursor text-[var(--accent-primary)]">▍</span>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg-base)] px-6 text-center">
        <p className="font-display text-3xl text-[var(--accent-warm)]">This link isn&apos;t active</p>
        <p className="font-body text-sm text-[var(--text-secondary)]">
          This session has ended or the code is invalid. Check with your facilitator for a fresh QR code.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] px-4 py-12 text-[var(--text-primary)]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="font-mono text-xs text-[var(--text-muted)]">join_token</p>
            <h1 className="font-display text-3xl">You&apos;re almost in</h1>
            <p className="font-mono text-sm text-[var(--accent-primary)]">{eventCode}</p>
          </div>
          <p className="font-body text-sm text-[var(--text-secondary)]">
            Tap below to claim your seat. No accounts — just a session marker on this device.
          </p>
          {error && <p className="font-mono text-xs text-red-400">{error}</p>}
          <Button
            className="w-full"
            disabled={status === "joining"}
            onClick={() => void join()}
          >
            {status === "joining" ? "joining…" : "Enter session"}
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}
