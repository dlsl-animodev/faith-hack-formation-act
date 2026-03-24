import { SupabaseClient } from "@supabase/supabase-js";

function groupStateFromPhase(phase: number, submitted: boolean): string {
  if (submitted) {
    return phase >= 6 ? "complete" : "submitted";
  }

  switch (phase) {
    case 1:
      return "formation";
    case 2:
      return "private_bugs";
    case 3:
      return "sharing";
    case 4:
      return "drafting_submission";
    case 5:
      return "puzzle_locking";
    case 6:
      return "completion";
    default:
      return "formation";
  }
}

export type ActiveEventPayload = {
  active: boolean;
  phase: number;
  totalGroups: number;
  groupsSubmitted: number;
  participantCount: number;
  eventCode: string | null;
  joinUrl: string | null;
  eventId?: string | null;
  groups: Array<{
    id: string;
    name: string;
    color: string;
    submitted: boolean;
    state: string;
    memberCount: number;
    bugCount: number;
    debugSummary: string | null;
    completionMessage: string | null;
    updatedAt: string;
  }>;
};

export async function computeActiveEventPayload(
  supabase: SupabaseClient,
): Promise<ActiveEventPayload> {
  try {
    // Fetch app state — maybeSingle() returns null (not an error) when no row exists
    const { data: state, error } = await supabase
      .from("app_state")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("[computeActiveEventPayload] app_state query error:", error);
      throw error;
    }

    // No app_state row exists yet — return a safe inactive default
    if (!state) {
      return {
        active: false,
        phase: 1,
        totalGroups: 0,
        groupsSubmitted: 0,
        participantCount: 0,
        eventCode: null,
        joinUrl: null,
        groups: [],
      };
    }

    const code = state.active_event_code;

    // If no active event code, return inactive payload
    if (!code) {
      return {
        active: false,
        phase: state.current_phase ?? 1,
        totalGroups: 0,
        groupsSubmitted: 0,
        participantCount: 0,
        eventCode: null,
        joinUrl: null,
        groups: [],
      };
    }

    // Look up event by code and is_active = true
    const { data: ev } = await supabase
      .from("events")
      .select("*")
      .eq("event_code", code)
      .eq("is_active", true)
      .maybeSingle();

    if (!ev) {
      // Event code in app_state is stale — clear it
      await supabase
        .from("app_state")
        .update({
          active_event_code: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      return {
        active: false,
        phase: state.current_phase ?? 1,
        totalGroups: 0,
        groupsSubmitted: 0,
        participantCount: 0,
        eventCode: null,
        joinUrl: null,
        groups: [],
      };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const joinUrl = `${appUrl.replace(/\/$/, "")}/join/${code}`;

    let groups: ActiveEventPayload["groups"] = [];
    let participantCount = 0;

    if (ev?.id) {
      const { data: gRows } = await supabase
        .from("groups")
        .select(
          "id, name, color, submitted, debug_summary, completion_message, updated_at",
        )
        .eq("event_id", ev.id)
        .order("created_at", { ascending: true });

      const { data: sessionRows } = await supabase
        .from("sessions")
        .select("id, group_id")
        .eq("event_id", ev.id)
        .not("group_id", "is", null);

      const sessionToGroup = new Map<string, string>();
      const memberCountByGroup = new Map<string, number>();
      const sessionIds: string[] = [];

      for (const s of sessionRows ?? []) {
        if (!s.id || !s.group_id) continue;
        sessionToGroup.set(s.id, s.group_id);
        sessionIds.push(s.id);
        memberCountByGroup.set(
          s.group_id,
          (memberCountByGroup.get(s.group_id) ?? 0) + 1,
        );
      }

      const bugCountByGroup = new Map<string, number>();
      if (sessionIds.length > 0) {
        const { data: bugRows } = await supabase
          .from("bugs")
          .select("session_id")
          .in("session_id", sessionIds);

        for (const b of bugRows ?? []) {
          if (!b.session_id) continue;
          const gId = sessionToGroup.get(b.session_id);
          if (!gId) continue;
          bugCountByGroup.set(gId, (bugCountByGroup.get(gId) ?? 0) + 1);
        }
      }

      const currentPhase = state.current_phase ?? 1;
      groups = (gRows ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        color: g.color,
        submitted: Boolean(g.submitted),
        state: groupStateFromPhase(currentPhase, Boolean(g.submitted)),
        memberCount: memberCountByGroup.get(g.id) ?? 0,
        bugCount: bugCountByGroup.get(g.id) ?? 0,
        debugSummary: g.debug_summary,
        completionMessage: g.completion_message,
        updatedAt: g.updated_at,
      }));

      const { count } = await supabase
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("event_id", ev.id);
      participantCount = count ?? 0;
    }

    return {
      active: true,
      eventId: ev?.id ?? null,
      eventCode: code,
      joinUrl,
      phase: state.current_phase ?? 1,
      totalGroups: state.total_groups ?? 0,
      groupsSubmitted: state.groups_submitted ?? 0,
      groups,
      participantCount,
    };
  } catch (e) {
    console.error("[computeActiveEventPayload] Error:", e);
    throw e;
  }
}
