"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFaithHackRealtime } from "@/hooks/useFaithHackRealtime";
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
    console.log("[HostClient] refresh() called");
    try {
      console.log("[HostClient] Fetching /api/events/active...");
      const res = await fetch("/api/events/active", { cache: "no-store" });
      console.log("[HostClient] Response status:", res.status);
      const data: unknown = await res.json();
      console.log("[HostClient] Full API response:", data);
      if (
        typeof data === "object" &&
        data &&
        "success" in data &&
        (data as { success: boolean }).success &&
        "data" in data
      ) {
        const p = (data as { data: ActivePayload }).data;
        console.log("[HostClient] Parsed payload:", p);
        console.log("[HostClient] Setting payload (active=" + p.active + ")");
        setPayload(p);
        if (typeof p.participantCount === "number") {
          console.log("[HostClient] Setting participantCount:", p.participantCount);
          setParticipantCount(p.participantCount);
        }
        if (p.active && Array.isArray(p.groups)) {
          const next = new Set<string>();
          for (const g of p.groups) {
            if (g.submitted) next.add(g.id);
          }
          console.log("[HostClient] Setting lockedIds from submitted groups:", Array.from(next));
          setLockedIds(next);
        }
        if (!p.active) {
          console.log("[HostClient] Event not active, clearing lockedIds");
          setLockedIds(new Set());
        }
      } else {
        console.error("[HostClient] Invalid API response format:", data);
      }
    } catch (e) {
      console.error("[HostClient] Fetch error:", e);
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

  useFaithHackRealtime(
    {
      onEventStarted: () => {
        setEventEnded(false);
        void refresh();
      },
      onEventEnded: () => {
        setEventEnded(true);
        setParticipantCount(0);
        void refresh();
      },
      onStateReset: () => {
        setPayload(null);
        setParticipantCount(0);
        setLockedIds(new Set());
        setEventEnded(false);
      },
      onParticipantCount: (c) => setParticipantCount(c.count),
      onGroupSubmitted: (p) => {
        setLockedIds((prev) => {
          const n = new Set(prev);
          n.add(p.groupId);
          return n;
        });
        void refresh();
      },
    },
    true
  );

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
