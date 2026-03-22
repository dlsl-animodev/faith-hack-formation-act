import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminRequest } from "@/lib/admin-request";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { joinSessionBodySchema } from "@/lib/schemas";
import { assignSessionToGroup, getGroupMemberCount } from "@/lib/groups";
import { syncTotalGroupsForEvent } from "@/lib/app-state-sync";
import { getSocketServer } from "@/lib/socket/server-io";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import { sanitizeText } from "@/lib/sanitize";

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = joinSessionBodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonErr(parsed.error.flatten().formErrors.join(", ") || "Invalid body");
  }

  const { eventCode, displayName } = parsed.data;

  try {
    const supabase = createAdminClient();
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("id")
      .eq("event_code", eventCode)
      .eq("is_active", true)
      .maybeSingle();

    if (evErr) {
      return jsonErr(evErr.message, 500);
    }
    if (!ev) {
      return jsonErr("Invalid or inactive event", 404);
    }

    const assignment = await assignSessionToGroup(supabase, ev.id);
    await syncTotalGroupsForEvent(supabase, ev.id);

    const name = displayName ? sanitizeText(displayName, 120) : null;

    const { data: session, error: sErr } = await supabase
      .from("sessions")
      .insert({
        event_id: ev.id,
        group_id: assignment.groupId,
        position: assignment.position,
        is_leader: assignment.position === 1,
        display_name: name || null,
      })
      .select("id")
      .single();

    if (sErr || !session) {
      return jsonErr(sErr?.message ?? "Failed to create session", 500);
    }

    const memberCount = await getGroupMemberCount(supabase, assignment.groupId);

    const { count: pCount } = await supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("event_id", ev.id);

    const io = getSocketServer();
    io?.to(`event:${eventCode}`).emit(SOCKET_EVENTS.PARTICIPANT_COUNT, {
      count: pCount ?? 0,
    });

    return jsonOk({
      sessionId: session.id,
      groupId: assignment.groupId,
      groupName: assignment.groupName,
      groupColor: assignment.groupColor,
      position: assignment.position,
      memberCount,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonErr(msg, 500);
  }
}
