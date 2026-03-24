"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { FH_REALTIME_CHANNEL } from "@/lib/realtime/constants";
import { SOCKET_EVENTS } from "@/lib/realtime/events";

export interface FaithHackRealtimeHandlers {
  onPhaseChanged?: (p: { phase: number }) => void;
  onEventEnded?: () => void;
  onStateReset?: (p: {
    phase: number;
    totalGroups: number;
    groupsSubmitted: number;
    participantCount: number;
    eventCode: string | null;
  }) => void;
  onParticipantCount?: (c: { count: number }) => void;
  onEventStarted?: () => void;
  onGroupSubmitted?: (p: {
    groupId: string;
    submittedCount?: number;
    totalGroups?: number;
    [key: string]: unknown;
  }) => void;
  onGroupAssigned?: (p: {
    groupId: string;
    memberCount: number;
    [key: string]: unknown;
  }) => void;
  onCompletionMessage?: (p: {
    groupId?: string;
    title: string;
    body: string;
  }) => void;
  onPuzzlePieceLocked?: (p: { groupId: string; [key: string]: unknown }) => void;
  onAllGroupsSubmitted?: () => void;
}

export function useFaithHackRealtime(
  handlers: FaithHackRealtimeHandlers,
  enabled = true
): void {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();
    const channel = supabase.channel(FH_REALTIME_CHANNEL, {
      config: { broadcast: { self: true } },
    });

    const sub = (
      event: string,
      fn: (payload: Record<string, unknown>) => void
    ) => {
      channel.on("broadcast", { event }, (msg: unknown) => {
        const raw = msg as Record<string, unknown>;
        const p =
          raw && typeof raw === "object" && "payload" in raw && raw.payload
            ? raw.payload
            : raw;
        if (p && typeof p === "object" && !Array.isArray(p)) {
          fn(p as Record<string, unknown>);
        }
      });
    };

    sub(SOCKET_EVENTS.PHASE_CHANGED, (p) =>
      ref.current.onPhaseChanged?.({ phase: Number(p.phase) ?? 1 })
    );
    sub(SOCKET_EVENTS.EVENT_ENDED, () => ref.current.onEventEnded?.());
    sub(SOCKET_EVENTS.STATE_RESET, (p) =>
      ref.current.onStateReset?.({
        phase: Number(p.phase) ?? 1,
        totalGroups: Number(p.totalGroups) ?? 0,
        groupsSubmitted: Number(p.groupsSubmitted) ?? 0,
        participantCount: Number(p.participantCount) ?? 0,
        eventCode: p.eventCode != null ? String(p.eventCode) : null,
      })
    );
    sub(SOCKET_EVENTS.PARTICIPANT_COUNT, (p) =>
      ref.current.onParticipantCount?.({ count: Number(p.count) ?? 0 })
    );
    sub(SOCKET_EVENTS.EVENT_STARTED, () => ref.current.onEventStarted?.());
    sub(SOCKET_EVENTS.GROUP_SUBMITTED, (p) =>
      ref.current.onGroupSubmitted?.({
        groupId: String(p.groupId ?? ""),
        submittedCount:
          typeof p.submittedCount === "number" ? p.submittedCount : undefined,
        totalGroups:
          typeof p.totalGroups === "number" ? p.totalGroups : undefined,
        ...p,
      })
    );
    sub(SOCKET_EVENTS.GROUP_ASSIGNED, (p) =>
      ref.current.onGroupAssigned?.({
        groupId: String(p.groupId ?? ""),
        memberCount: Number(p.memberCount) ?? 0,
        ...p,
      })
    );
    sub(SOCKET_EVENTS.COMPLETION_MESSAGE, (p) =>
      ref.current.onCompletionMessage?.({
        groupId: p.groupId != null ? String(p.groupId) : undefined,
        title: String(p.title ?? ""),
        body: String(p.body ?? ""),
      })
    );
    sub(SOCKET_EVENTS.PUZZLE_PIECE_LOCKED, (p) =>
      ref.current.onPuzzlePieceLocked?.({
        groupId: String(p.groupId ?? ""),
        ...p,
      })
    );
    sub(SOCKET_EVENTS.ALL_GROUPS_SUBMITTED, () =>
      ref.current.onAllGroupsSubmitted?.()
    );

    void channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled]);
}
