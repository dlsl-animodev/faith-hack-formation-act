import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminRequest } from "@/lib/admin-request";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { generateEventCode } from "@/lib/event-code";
import { getSocketServer } from "@/lib/socket/server-io";
import { SOCKET_EVENTS } from "@/lib/socket/events";

export async function POST(request: Request) {
  if (!verifyAdminRequest(request)) {
    return jsonErr("Unauthorized", 401);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = createAdminClient();

  let eventCode = generateEventCode();
  for (let attempt = 0; attempt < 8; attempt++) {
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("event_code", eventCode)
      .maybeSingle();
    if (!existing) break;
    eventCode = generateEventCode();
  }

  const { data: ev, error: insertErr } = await supabase
    .from("events")
    .insert({ event_code: eventCode, is_active: true })
    .select("id, event_code")
    .single();

  if (insertErr || !ev) {
    return jsonErr(insertErr?.message ?? "Failed to create event", 500);
  }

  const now = new Date().toISOString();
  /** Supersede prior active events (new row above is always inserted; others move to history). */
  const { error: deactivateErr } = await supabase
    .from("events")
    .update({
      is_active: false,
      ended_at: now,
      updated_at: now,
    })
    .eq("is_active", true)
    .neq("id", ev.id);

  if (deactivateErr) {
    return jsonErr(deactivateErr.message, 500);
  }

  const { error: stateErr } = await supabase.from("app_state").upsert(
    {
      id: 1,
      current_phase: 1,
      total_groups: 0,
      groups_submitted: 0,
      active_event_code: eventCode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (stateErr) {
    return jsonErr(stateErr.message, 500);
  }

  const joinUrl = `${appUrl.replace(/\/$/, "")}/join/${ev.event_code}`;
  const payload = {
    eventId: ev.id,
    eventCode: ev.event_code,
    joinUrl,
  };

  const io = getSocketServer();
  io?.emit(SOCKET_EVENTS.EVENT_STARTED, payload);
  io?.emit(SOCKET_EVENTS.PARTICIPANT_COUNT, { count: 0 });
  io?.emit(SOCKET_EVENTS.PHASE_CHANGED, { phase: 1 });

  return jsonOk(payload);
}
