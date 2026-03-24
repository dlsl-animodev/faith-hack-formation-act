import { createAdminClient } from "@/lib/supabase/admin";
import { jsonErr, jsonOk } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: state, error } = await supabase
      .from("app_state")
      .select("*")
      .eq("id", 1)
      .single();

    console.log("[API /events/active] app_state read", {
      hasState: Boolean(state),
      hasError: Boolean(error),
      phase: state?.current_phase ?? null,
      hasActiveCode: Boolean(state?.active_event_code),
    });

    if (error) {
      console.error("[API /events/active] app_state query error:", error);
      return jsonErr(error.message, 500);
    }

    console.log("State fetched successfully:", state);

    const code = state?.active_event_code;

    if (!code) {
      console.log(
        "[API /events/active] No active event code, returning inactive payload",
      );
      return jsonOk({
        active: false as const,
        phase: state?.current_phase ?? 1,
        totalGroups: 0,
        groupsSubmitted: 0,
        participantCount: 0,
        eventCode: null,
        joinUrl: null,
        groups: [],
      });
    }

    console.log("[API /events/active] Looking up event with code:", code);
    const { data: ev } = await supabase
      .from("events")
      .select("id, event_code, is_active")
      .eq("event_code", code)
      .maybeSingle();

    console.log("[API /events/active] Event lookup result:", ev);

    if (!ev) {
      console.log(
        "[API /events/active] Event not found, clearing app_state active_event_code",
      );
      await supabase
        .from("app_state")
        .update({
          active_event_code: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      return jsonOk({
        active: false as const,
        phase: state?.current_phase ?? 1,
        totalGroups: 0,
        groupsSubmitted: 0,
        participantCount: 0,
        eventCode: null,
        joinUrl: null,
        groups: [],
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const joinUrl = `${appUrl.replace(/\/$/, "")}/join/${code}`;

    let groups:
      | Array<{
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
        }>
      | undefined;
    let participantCount = 0;
    if (ev?.id) {
      console.log("[API /events/active] Fetching groups for event:", ev.id);
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

      const currentPhase = state?.current_phase ?? 1;
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

      console.log("[API /events/active] Groups fetched:", groups);

      const { count } = await supabase
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("event_id", ev.id);
      participantCount = count ?? 0;
      console.log("[API /events/active] Participant count:", participantCount);
    }

    const responsePayload = {
      active: true as const,
      eventId: ev?.id ?? null,
      eventCode: code,
      joinUrl,
      phase: state?.current_phase ?? 1,
      totalGroups: state?.total_groups ?? 0,
      groupsSubmitted: state?.groups_submitted ?? 0,
      groups: groups ?? [],
      participantCount,
    };

    console.log(
      "[API /events/active] Returning active event payload:",
      responsePayload,
    );
    return jsonOk(responsePayload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    console.error("[API /events/active] Catch error:", msg, e);
    return jsonErr(msg, 500);
  }
}
