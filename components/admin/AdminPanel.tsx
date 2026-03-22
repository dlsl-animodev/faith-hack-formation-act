"use client";

import { useCallback, useEffect, useState } from "react";
import { getSocket } from "@/lib/socket/client";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import { PhaseControls } from "@/components/admin/PhaseControls";
import { EventHistory } from "@/components/admin/EventHistory";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface LiveStats {
  phase: number;
  totalGroups: number;
  groupsSubmitted: number;
  participantCount: number;
  eventCode: string | null;
}

interface AdminPanelProps {
  adminSecret: string;
}

export function AdminPanel({ adminSecret }: AdminPanelProps) {
  const [tab, setTab] = useState<"live" | "history">("live");
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      "x-admin-secret": adminSecret,
    }),
    [adminSecret]
  );

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/events/active");
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data &&
        "success" in data &&
        (data as { success: boolean }).success &&
        "data" in data
      ) {
        const p = (data as { data: Record<string, unknown> }).data;
        if (p.active) {
          setEventId(typeof p.eventId === "string" ? p.eventId : null);
          setStats({
            phase: typeof p.phase === "number" ? p.phase : 1,
            totalGroups: typeof p.totalGroups === "number" ? p.totalGroups : 0,
            groupsSubmitted:
              typeof p.groupsSubmitted === "number" ? p.groupsSubmitted : 0,
            participantCount:
              typeof p.participantCount === "number" ? p.participantCount : 0,
            eventCode: typeof p.eventCode === "string" ? p.eventCode : null,
          });
        } else {
          setEventId(null);
          setStats({
            phase: typeof p.phase === "number" ? p.phase : 1,
            totalGroups: 0,
            groupsSubmitted: 0,
            participantCount: 0,
            eventCode: null,
          });
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 4000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const socket = getSocket({ adminSecret });
    const onCount = (c: { count: number }) => {
      setStats((s) => (s ? { ...s, participantCount: c.count } : s));
    };
    const onStarted = () => {
      void refresh();
    };
    socket.on(SOCKET_EVENTS.PARTICIPANT_COUNT, onCount);
    socket.on(SOCKET_EVENTS.EVENT_STARTED, onStarted);
    return () => {
      socket.off(SOCKET_EVENTS.PARTICIPANT_COUNT, onCount);
      socket.off(SOCKET_EVENTS.EVENT_STARTED, onStarted);
    };
  }, [adminSecret, refresh]);

  const startEvent = async () => {
    setBusy(true);
    setMessage(null);
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
        void refresh();
      } else {
        const err =
          typeof data === "object" &&
          data &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed";
        setMessage(err);
      }
    } finally {
      setBusy(false);
    }
  };

  const endEvent = async () => {
    if (!eventId) {
      setMessage("No active event.");
      return;
    }
    if (!window.confirm("End this event for everyone? This cannot be undone.")) return;
    setBusy(true);
    setMessage(null);
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
        void refresh();
      } else {
        const err =
          typeof data === "object" &&
          data &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed";
        setMessage(err);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 text-[var(--text-primary)]">
      <header className="space-y-2">
        <p className="font-mono text-xs text-[var(--text-muted)]">faith_hack // admin</p>
        <h1 className="font-display text-4xl">Control room</h1>
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
            <p className="font-mono text-xs text-[var(--text-muted)]">live_stats</p>
            <div className="grid gap-3 font-mono text-sm sm:grid-cols-2">
              <div>
                <p className="text-[var(--text-muted)]">phase</p>
                <p className="text-xl text-[var(--accent-warm)]">{stats?.phase ?? "—"}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">event_code</p>
                <p className="text-xl text-[var(--accent-primary)]">{stats?.eventCode ?? "—"}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">groups</p>
                <p>{stats?.totalGroups ?? 0}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">submitted</p>
                <p>{stats?.groupsSubmitted ?? 0}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">participants (socket)</p>
                <p>{stats?.participantCount ?? 0}</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <p className="font-mono text-xs text-[var(--text-muted)]">orchestration</p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" disabled={busy} onClick={() => void startEvent()}>
                Start new event
              </Button>
              <Button type="button" variant="ghost" disabled={busy || !eventId} onClick={() => void endEvent()}>
                End event
              </Button>
            </div>
            <PhaseControls adminSecret={adminSecret} />
            {message && <p className="font-mono text-xs text-[var(--accent-success)]">{message}</p>}
          </Card>
        </div>
      )}

      {tab === "history" && <EventHistory adminSecret={adminSecret} />}
    </div>
  );
}
