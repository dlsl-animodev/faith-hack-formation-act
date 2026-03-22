import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminRequest } from "@/lib/admin-request";
import { jsonErr, jsonOk } from "@/lib/api-response";
import type { EventSummary } from "@/types";
import { getSocketServer } from "@/lib/socket/server-io";
import { SOCKET_EVENTS } from "@/lib/socket/events";

interface RouteParams {
  params: { eventId: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  if (!verifyAdminRequest(request)) {
    return jsonErr("Unauthorized", 401);
  }

  const { eventId } = params;
  if (!eventId) {
    return jsonErr("Missing event", 400);
  }

  try {
    const supabase = createAdminClient();
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("id, event_code")
      .eq("id", eventId)
      .maybeSingle();

    if (evErr || !ev) {
      return jsonErr("Event not found", 404);
    }

    const { count: totalParticipants, error: pErr } = await supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("event_id", ev.id);

    if (pErr) {
      return jsonErr(pErr.message, 500);
    }

    const { data: groups, error: gErr } = await supabase
      .from("groups")
      .select("id, name, color, debug_summary, completion_message")
      .eq("event_id", ev.id)
      .order("created_at", { ascending: true });

    if (gErr) {
      return jsonErr(gErr.message, 500);
    }

    const groupSummaries = await Promise.all(
      (groups ?? []).map(async (g) => {
        const { count } = await supabase
          .from("sessions")
          .select("id", { count: "exact", head: true })
          .eq("group_id", g.id);
        return {
          name: g.name,
          color: g.color,
          memberCount: count ?? 0,
          debugSummary: g.debug_summary ?? "",
          completionMessage: g.completion_message ?? "",
        };
      })
    );

    const summary: EventSummary = {
      totalParticipants: totalParticipants ?? 0,
      totalGroups: groups?.length ?? 0,
      groups: groupSummaries,
    };

    const { error: upErr } = await supabase
      .from("events")
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
        summary,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ev.id);

    if (upErr) {
      return jsonErr(upErr.message, 500);
    }

    const { error: stErr } = await supabase
      .from("app_state")
      .update({
        current_phase: 1,
        total_groups: 0,
        groups_submitted: 0,
        active_event_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (stErr) {
      return jsonErr(stErr.message, 500);
    }

    const io = getSocketServer();
    io?.emit(SOCKET_EVENTS.EVENT_ENDED, { eventCode: ev.event_code });
    io?.emit(SOCKET_EVENTS.PARTICIPANT_COUNT, { count: 0 });

    return jsonOk({ ended: true as const });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonErr(msg, 500);
  }
}
