"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ActiveEventPayload } from "@/lib/compute-active-event-payload";

export interface EventRealtimeState {
  payload: ActiveEventPayload | null;
  /** Standalone participant count that can be updated cheaply from broadcast events */
  participantCount: number;
  /** Call this after mutations (start event, end event, advance phase) to force a re-fetch */
  refresh: () => void;
}

/**
 * Replaces setInterval polling with:
 * 1. An initial one-shot fetch via /api/events/active.
 * 2. Supabase Postgres Changes subscriptions to trigger re-fetches.
 *
 * NOTE: Realtime must be enabled in the Supabase dashboard for these tables:
 *   app_state, groups, sessions
 * Dashboard → Database → Replication → enable each table.
 */
export function useEventRealtimeSubscription(): EventRealtimeState {
  const [payload, setPayload] = useState<ActiveEventPayload | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  // Use a counter to trigger re-fetches imperatively (e.g. after mutations)
  const [refreshCounter, setRefreshCounter] = useState(0);
  const supabaseRef = useRef(createClient());

  const refresh = useCallback(() => {
    setRefreshCounter((n) => n + 1);
  }, []);

  const fetchActiveEvent = async () => {
    try {
      console.log("[useEventRealtimeSubscription] 📡 Fetching /api/events/active...");
      const res = await fetch("/api/events/active", { cache: "no-store" });
      const data: unknown = await res.json();
      console.log("[useEventRealtimeSubscription] 📥 Raw API response:", data);
      
      if (
        typeof data === "object" &&
        data &&
        "success" in data &&
        (data as { success: boolean }).success &&
        "data" in data
      ) {
        const p = (data as { data: ActiveEventPayload }).data;
        console.log("[useEventRealtimeSubscription] ✅ Parsed Payload:", p);
        return p;
      }
      console.warn("[useEventRealtimeSubscription] ⚠️ API response invalid format or success=false");
      return null;
    } catch (err) {
      console.error("[useEventRealtimeSubscription] ❌ fetch error:", err);
      return null;
    }
  };

  // Load payload whenever refreshCounter changes or on initial mount
  useEffect(() => {
    let cancelled = false;

    void fetchActiveEvent().then((p) => {
      if (cancelled || !p) return;
      setPayload(p);
      setParticipantCount(p.participantCount);
    });

    return () => {
      cancelled = true;
    };
  }, [refreshCounter]);

  // Postgres Changes subscriptions — re-fetch full payload on any relevant change
  useEffect(() => {
    const supabase = supabaseRef.current;

    // Debounce rapid bursts (e.g. multiple group inserts at once)
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void fetchActiveEvent().then((p) => {
          if (!p) return;
          setPayload(p);
          setParticipantCount(p.participantCount);
        });
      }, 150);
    };

    const channel = supabase
      .channel("event-realtime-subscription")
      // app_state row changes drive phase, event_code, totals
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "app_state",
          filter: "id=eq.1",
        },
        (payload) => {
          console.log("[useEventRealtimeSubscription] 🔄 app_state UPDATE received via Realtime:", payload);
          scheduleRefetch();
        },
      )
      // groups table: member joins, submissions, name/color changes
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "groups",
        },
        (payload) => {
          console.log("[useEventRealtimeSubscription] 🔄 groups CHANGE received via Realtime:", payload);
          scheduleRefetch();
        },
      )
      // sessions table: participants joining/leaving → participant count
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sessions",
        },
        (payload) => {
          console.log("[useEventRealtimeSubscription] 🔄 sessions INSERT received via Realtime:", payload);
          scheduleRefetch();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "sessions",
        },
        (payload) => {
          console.log("[useEventRealtimeSubscription] 🔄 sessions DELETE received via Realtime:", payload);
          scheduleRefetch();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[useEventRealtimeSubscription] ✅ Postgres Changes subscribed successfully");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[useEventRealtimeSubscription] ❌ channel status:", status);
        }
      });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      void supabase.removeChannel(channel);
    };
  }, []);

  return { payload, participantCount, refresh };
}
