import { createAdminClient } from "@/lib/supabase/admin";
import { jsonErr, jsonOk } from "@/lib/api-response";

interface RouteParams {
  params: { sessionId: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { sessionId } = params;
  if (!sessionId) {
    return jsonErr("Missing session", 400);
  }

  try {
    const supabase = createAdminClient();
    const { data: session, error: sErr } = await supabase
      .from("sessions")
      .select("id, event_id, group_id, position, is_leader, display_name")
      .eq("id", sessionId)
      .maybeSingle();

    if (sErr) {
      return jsonErr(sErr.message, 500);
    }
    if (!session?.group_id) {
      return jsonErr("Session not found", 404);
    }

    const { data: ev } = await supabase
      .from("events")
      .select("event_code, is_active")
      .eq("id", session.event_id)
      .single();

    if (!ev?.is_active) {
      return jsonErr("Event is not active", 410);
    }

    const { data: group } = await supabase
      .from("groups")
      .select("id, name, color")
      .eq("id", session.group_id)
      .single();

    const { data: state } = await supabase
      .from("app_state")
      .select("current_phase, total_groups, groups_submitted")
      .eq("id", 1)
      .single();

    const { data: bugs } = await supabase
      .from("bugs")
      .select("id, label, is_custom")
      .eq("session_id", sessionId);

    const { data: share } = await supabase
      .from("sharing_prompts")
      .select("prompt_text, position")
      .eq("session_id", sessionId)
      .maybeSingle();

    const { count: memberCount } = await supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("group_id", session.group_id);

    return jsonOk({
      sessionId: session.id,
      eventCode: ev.event_code,
      phase: state?.current_phase ?? 1,
      totalGroups: state?.total_groups ?? 0,
      groupsSubmitted: state?.groups_submitted ?? 0,
      group: {
        id: group?.id,
        name: group?.name,
        color: group?.color,
        position: session.position,
        memberCount: memberCount ?? 0,
        isLeader: session.is_leader,
      },
      bugs: bugs ?? [],
      sharingPrompt: share?.prompt_text ?? null,
      sharingPosition: share?.position ?? session.position,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonErr(msg, 500);
  }
}
