"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSocket } from "@/lib/socket/client";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import { buildPuzzleGrid } from "@/lib/puzzle";
import type { PuzzlePiece } from "@/types";
import { HostVisualizer } from "@/components/host/HostVisualizer";

interface ActiveGroup {
  id: string;
  name: string;
  color: string;
  submitted: boolean;
}

interface ActivePayload {
  active: boolean;
  eventId?: string | null;
  eventCode?: string;
  joinUrl?: string;
  phase?: number;
  totalGroups?: number;
  groupsSubmitted?: number;
  participantCount?: number;
  groups?: ActiveGroup[];
}

export function HostClient() {
  const [payload, setPayload] = useState<ActivePayload | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [lockedIds, setLockedIds] = useState<Set<string>>(() => new Set());
  const [eventEnded, setEventEnded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/events/active", { cache: "no-store" });
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data &&
        "success" in data &&
        (data as { success: boolean }).success &&
        "data" in data
      ) {
        const p = (data as { data: ActivePayload }).data;
        setPayload(p);
        if (typeof p.participantCount === "number") {
          setParticipantCount(p.participantCount);
        }
        if (p.active && Array.isArray(p.groups)) {
          const next = new Set<string>();
          for (const g of p.groups) {
            if (g.submitted) next.add(g.id);
          }
          setLockedIds(next);
        }
        if (!p.active) {
          setLockedIds(new Set());
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const waiting = !payload?.active;
  useEffect(() => {
    void refresh();
    const ms = waiting ? 1500 : 5000;
    const id = setInterval(() => void refresh(), ms);
    return () => clearInterval(id);
  }, [refresh, waiting]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  const eventCode = payload?.active ? payload.eventCode : undefined;

  useEffect(() => {
    const socket = getSocket();

    const onStarted = () => {
      setEventEnded(false);
      void refresh();
    };
    const onEnded = () => {
      setEventEnded(true);
      setParticipantCount(0);
      void refresh();
    };
    const onCount = (c: { count: number }) => setParticipantCount(c.count);
    const onSubmitted = (p: { groupId: string; submittedCount?: number }) => {
      setLockedIds((prev) => {
        const n = new Set(prev);
        n.add(p.groupId);
        return n;
      });
      void refresh();
    };

    socket.on(SOCKET_EVENTS.EVENT_STARTED, onStarted);
    socket.on(SOCKET_EVENTS.EVENT_ENDED, onEnded);
    socket.on(SOCKET_EVENTS.PARTICIPANT_COUNT, onCount);
    socket.on(SOCKET_EVENTS.GROUP_SUBMITTED, onSubmitted);

    return () => {
      socket.off(SOCKET_EVENTS.EVENT_STARTED, onStarted);
      socket.off(SOCKET_EVENTS.EVENT_ENDED, onEnded);
      socket.off(SOCKET_EVENTS.PARTICIPANT_COUNT, onCount);
      socket.off(SOCKET_EVENTS.GROUP_SUBMITTED, onSubmitted);
    };
  }, [refresh]);

  const { pieces, cols, rows } = useMemo(() => {
    const groups = payload?.active && Array.isArray(payload.groups) ? payload.groups : [];
    const meta = groups.map((g) => ({ id: g.id, name: g.name, color: g.color }));
    return buildPuzzleGrid(meta.length, meta);
  }, [payload]);

  const mode = useMemo(() => {
    if (eventEnded || !payload?.active) return "qr" as const;
    const ph = payload.phase ?? 1;
    if (ph >= 5) return "puzzle" as const;
    return "qr" as const;
  }, [payload, eventEnded]);

  const joinUrl = payload?.joinUrl ?? "";
  const submitted = payload?.groupsSubmitted ?? 0;
  const total = payload?.totalGroups ?? 0;

  const piecesWithLock: PuzzlePiece[] = useMemo(
    () =>
      pieces.map((p) =>
        p.groupId && lockedIds.has(p.groupId) ? { ...p, locked: true } : p
      ),
    [pieces, lockedIds]
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
    />
  );
}
