"use client";

import { useCallback, useEffect, useState } from "react";
import { useFaithHackRealtime } from "@/hooks/useFaithHackRealtime";
import { useEventRealtimeSubscription } from "@/hooks/useEventRealtimeSubscription";
import { PhaseControls } from "@/components/admin/PhaseControls";
import { EventHistory } from "@/components/admin/EventHistory";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface AdminPanelProps {
  adminSecret: string;
}

export function AdminPanel({ adminSecret }: AdminPanelProps) {
  const [tab, setTab] = useState<"live" | "history">("live");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);

  const { payload, participantCount: rtParticipantCount, refresh } =
    useEventRealtimeSubscription();

  // Allow broadcast events to override participant count between DB refetches
  const [overrideCount, setOverrideCount] = useState<number | null>(null);
  const participantCount =
    overrideCount !== null ? overrideCount : rtParticipantCount;

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      "x-admin-secret": adminSecret,
    }),
    [adminSecret],
  );

  // Reset broadcast override whenever a real DB refetch updates the count
  useEffect(() => {
    setOverrideCount(null);
  }, [rtParticipantCount]);

  // Keep broadcast channel for lightweight incremental updates that don't need a DB round-trip
  useFaithHackRealtime(
    {
      onParticipantCount: (c) => setOverrideCount(c.count),
      onEventStarted: () => refresh(),
      onEventEnded: () => refresh(),
      onStateReset: () => refresh(),
    },
    true,
  );

  const startEvent = async () => {
    if (payload?.active) return;
    setBusy(true);
    setMessage(null);
    setMessageIsError(false);
    try {
      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({}),
      });
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data &&
        "success" in data &&
        (data as { success: boolean }).success
      ) {
        setMessage("Event started — host display updated.");
        setMessageIsError(false);
        refresh();
      } else {
        const err =
          typeof data === "object" &&
          data &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed";
        setMessage(err);
        setMessageIsError(true);
      }
    } finally {
      setBusy(false);
    }
  };

  const endEvent = async () => {
    const eventId =
      typeof payload?.eventId === "string" ? payload.eventId : null;
    if (!eventId) {
      setMessage("No active event.");
      return;
    }
    if (!window.confirm("End this event for everyone? This cannot be undone."))
      return;
    setBusy(true);
    setMessage(null);
    setMessageIsError(false);
    try {
      const res = await fetch(`/api/events/end/${eventId}`, {
        method: "POST",
        headers: headers(),
      });
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data &&
        "success" in data &&
        (data as { success: boolean }).success
      ) {
        setMessage("Event ended. Summary saved.");
        setMessageIsError(false);
        refresh();
      } else {
        const err =
          typeof data === "object" &&
          data &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed";
        setMessage(err);
        setMessageIsError(true);
      }
    } finally {
      setBusy(false);
    }
  };

  const eventId =
    typeof payload?.eventId === "string" ? payload.eventId : null;
  const liveEventCode = payload?.eventCode ?? null;
  const ongoing = Boolean(eventId && liveEventCode && payload?.active);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 text-[var(--text-primary)]">
      <header className="space-y-4">
        <div className="space-y-2">
          <p className="font-mono text-xs text-[var(--text-muted)]">
            faith_hack // admin
          </p>
          <h1 className="font-display text-4xl">Control room</h1>
        </div>
        {ongoing ? (
          <div
            className="flex flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            aria-live="polite"
          >
            <p className="font-mono text-xs uppercase tracking-wide text-[var(--accent-warm)]">
              Ongoing event
            </p>
            <p className="font-mono text-2xl font-semibold tracking-[0.25em] text-[var(--accent-primary)]">
              {liveEventCode}
            </p>
          </div>
        ) : null}
      </header>

      <div className="flex gap-2 border-b border-[var(--border)] pb-2 font-mono text-sm">
        <button
          type="button"
          className={`rounded-lg px-3 py-2 ${tab === "live" ? "bg-[var(--bg-card)] text-[var(--accent-primary)]" : "text-[var(--text-muted)]"}`}
          onClick={() => setTab("live")}
        >
          Live event
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-2 ${tab === "history" ? "bg-[var(--bg-card)] text-[var(--accent-primary)]" : "text-[var(--text-muted)]"}`}
          onClick={() => setTab("history")}
        >
          Event history
        </button>
      </div>

      {tab === "live" && (
        <div className="space-y-6">
          <Card className="space-y-4">
            <p className="font-mono text-xs text-[var(--text-muted)]">
              live_stats
            </p>
            <div className="grid gap-3 font-mono text-sm sm:grid-cols-2">
              <div>
                <p className="text-[var(--text-muted)]">phase</p>
                <p className="text-xl text-[var(--accent-warm)]">
                  {payload?.phase ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">event_code</p>
                <p className="text-xl text-[var(--accent-primary)]">
                  {payload?.eventCode ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">groups</p>
                <p>{payload?.totalGroups ?? 0}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">submitted</p>
                <p>{payload?.groupsSubmitted ?? 0}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">participants (live)</p>
                <p>{participantCount}</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <p className="font-mono text-xs text-[var(--text-muted)]">
              orchestration
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={busy || !!eventId}
                title={
                  eventId
                    ? "End the current event before starting another."
                    : undefined
                }
                onClick={() => void startEvent()}
              >
                Start new event
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy || !eventId}
                onClick={() => void endEvent()}
              >
                End event
              </Button>
            </div>
            <PhaseControls adminSecret={adminSecret} onPhaseUpdate={refresh} />
            {message && (
              <p
                className={`font-mono text-xs ${
                  messageIsError
                    ? "text-[var(--accent-warm)]"
                    : "text-[var(--accent-success)]"
                }`}
              >
                {message}
              </p>
            )}
          </Card>
        </div>
      )}

      {tab === "history" && <EventHistory adminSecret={adminSecret} />}
    </div>
  );
}
