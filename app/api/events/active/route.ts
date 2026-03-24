import { createAdminClient } from "@/lib/supabase/admin";
import { jsonErr, jsonOk } from "@/lib/api-response";

export async function GET() {
  try {
    console.log("[API /events/active] GET request received");
    const supabase = createAdminClient();
    const { data: state, error } = await supabase
      .from("app_state")
      .select("current_phase, active_event_code, total_groups, groups_submitted")
      .eq("id", 1)
      .single();

    console.log("[API /events/active] app_state query result:", { state, error });

    if (error) {
      console.error("[API /events/active] app_state query error:", error);
      return jsonErr(error.message, 500);
    }

    const code = state?.active_event_code;
    console.log("[API /events/active] active_event_code from app_state:", code);
    
    if (!code) {
      console.log("[API /events/active] No active event code, returning inactive payload");
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
      console.log("[API /events/active] Event not found, clearing app_state active_event_code");
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
      | Array<{ id: string; name: string; color: string; submitted: boolean }>
      | undefined;
    let participantCount = 0;
    if (ev?.id) {
      console.log("[API /events/active] Fetching groups for event:", ev.id);
      const { data: gRows } = await supabase
        .from("groups")
        .select("id, name, color, submitted")
        .eq("event_id", ev.id)
        .order("created_at", { ascending: true });
      groups = gRows ?? [];
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
    
    console.log("[API /events/active] Returning active event payload:", responsePayload);
    return jsonOk(responsePayload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    console.error("[API /events/active] Catch error:", msg, e);
    return jsonErr(msg, 500);
  }
}
