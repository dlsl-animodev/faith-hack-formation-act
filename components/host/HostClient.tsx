"use client";

import { useEffect, useMemo, useState } from "react";
import { useFaithHackRealtime } from "@/hooks/useFaithHackRealtime";
import { useEventRealtimeSubscription } from "@/hooks/useEventRealtimeSubscription";
import { buildPuzzleGrid } from "@/lib/puzzle";
import type { PuzzlePiece } from "@/types";
import { HostVisualizer } from "@/components/host/HostVisualizer";

export function HostClient() {
  const { payload, participantCount: rtParticipantCount, refresh } =
    useEventRealtimeSubscription();

  // Broadcast events can push a fresher participant count between DB refetches
  const [overrideCount, setOverrideCount] = useState<number | null>(null);
  const participantCount =
    overrideCount !== null ? overrideCount : rtParticipantCount;

  const [lockedIds, setLockedIds] = useState<Set<string>>(() => new Set());
  const [eventEnded, setEventEnded] = useState(false);

  // Reset broadcast override whenever the DB refetch delivers a new count
  useEffect(() => {
    setOverrideCount(null);
  }, [rtParticipantCount]);

  // Sync locked puzzle pieces from payload (initial load + every DB-driven refetch)
  useEffect(() => {
    if (payload?.active && Array.isArray(payload.groups)) {
      const next = new Set<string>();
      for (const g of payload.groups) {
        if (g.submitted) next.add(g.id);
      }
      setLockedIds(next);
    }
    if (!payload?.active) {
      setLockedIds(new Set());
    }
  }, [payload]);

  // Keep broadcast channel for real-time incremental updates that have no polling fallback
  useFaithHackRealtime(
    {
      onEventStarted: () => {
        setEventEnded(false);
        refresh();
      },
      onEventEnded: () => {
        setEventEnded(true);
        setOverrideCount(0);
        refresh();
      },
      onStateReset: () => {
        setOverrideCount(null);
        setLockedIds(new Set());
        setEventEnded(false);
      },
      onParticipantCount: (c) => setOverrideCount(c.count),
      onGroupSubmitted: (p) => {
        // Mark the group's puzzle piece as locked immediately (no need to wait for DB refetch)
        setLockedIds((prev) => {
          const n = new Set(prev);
          n.add(p.groupId);
          return n;
        });
      },
      onPhaseChanged: () => {
        // Postgres Changes will also fire for phase updates via app_state —
        // call refresh() here so the view snaps immediately without waiting for debounce
        refresh();
      },
    },
    true,
  );

  const { pieces, cols, rows } = useMemo(() => {
    const groups =
      payload?.active && Array.isArray(payload.groups) ? payload.groups : [];
    const meta = groups.map((g) => ({ id: g.id, name: g.name, color: g.color }));
    return buildPuzzleGrid(meta.length, meta);
  }, [payload]);

  const mode = useMemo(() => {
    if (eventEnded || !payload?.active) return "qr" as const;
    const ph = payload.phase ?? 1;
    if (ph >= 5) return "puzzle" as const;
    return "qr" as const;
  }, [payload, eventEnded]);

  const eventCode = payload?.active ? payload.eventCode : undefined;
  const joinUrl = payload?.joinUrl ?? "";
  const submitted = payload?.groupsSubmitted ?? 0;
  const total = payload?.totalGroups ?? 0;
  const phase = payload?.phase ?? 1;
  const groups = payload?.groups ?? [];

  const piecesWithLock: PuzzlePiece[] = useMemo(
    () =>
      pieces.map((p) =>
        p.groupId && lockedIds.has(p.groupId) ? { ...p, locked: true } : p,
      ),
    [pieces, lockedIds],
  );

  if (!payload?.active) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg-base)] px-6 text-center text-[var(--text-secondary)]">
        <p className="font-display text-3xl text-[var(--text-primary)]">Faith Hack</p>
        <p className="font-mono text-sm">
          Waiting for facilitator to start an event
          <span className="ml-1 animate-cursor text-[var(--accent-primary)]">▍</span>
        </p>
      </div>
    );
  }

  return (
    <HostVisualizer
      mode={mode === "puzzle" ? "puzzle" : "qr"}
      eventCode={eventCode}
      joinUrl={joinUrl}
      participantCount={participantCount}
      pieces={piecesWithLock}
      cols={cols}
      rows={rows}
      lockedIds={lockedIds}
      submitted={submitted}
      total={total}
      phase={phase}
      groups={groups}
    />
  );
}
