import { createAdminClient } from "@/lib/supabase/admin";
import { jsonErr, jsonOk } from "@/lib/api-response";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: state, error } = await supabase
      .from("app_state")
      .select("current_phase, active_event_code, total_groups, groups_submitted")
      .eq("id", 1)
      .single();

    if (error) {
      return jsonErr(error.message, 500);
    }

    const code = state?.active_event_code;
    if (!code) {
      return jsonOk({
        active: false as const,
        phase: state?.current_phase ?? 1,
      });
    }

    const { data: ev } = await supabase
      .from("events")
      .select("id, event_code, is_active")
      .eq("event_code", code)
      .maybeSingle();

    if (!ev) {
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
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const joinUrl = `${appUrl.replace(/\/$/, "")}/join/${code}`;

    let groups:
      | Array<{ id: string; name: string; color: string; submitted: boolean }>
      | undefined;
    let participantCount = 0;
    if (ev?.id) {
      const { data: gRows } = await supabase
        .from("groups")
        .select("id, name, color, submitted")
        .eq("event_id", ev.id)
        .order("created_at", { ascending: true });
      groups = gRows ?? [];
      const { count } = await supabase
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("event_id", ev.id);
      participantCount = count ?? 0;
    }

    return jsonOk({
      active: true as const,
      eventId: ev?.id ?? null,
      eventCode: code,
      joinUrl,
      phase: state?.current_phase ?? 1,
      totalGroups: state?.total_groups ?? 0,
      groupsSubmitted: state?.groups_submitted ?? 0,
      groups: groups ?? [],
      participantCount,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonErr(msg, 500);
  }
}
