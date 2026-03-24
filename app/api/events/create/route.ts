import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminRequest } from "@/lib/admin-request";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { generateEventCode } from "@/lib/event-code";
import { realtimeBroadcastFire } from "@/lib/realtime/broadcast-server";
import { SOCKET_EVENTS } from "@/lib/realtime/events";

export async function POST(request: Request) {
  console.log("[API /events/create] ========== POST HANDLER CALLED ==========");
  console.log("[API /events/create] Request method:", request.method);
  console.log("[API /events/create] Request URL:", request.url);

  if (!verifyAdminRequest(request)) {
    console.log(
      "[API /events/create] ========== AUTHORIZATION FAILED ==========",
    );
    return jsonErr("Unauthorized", 401);
  }

  console.log(
    "[API /events/create] ========== AUTHORIZATION SUCCESS ==========",
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = createAdminClient();

  console.log(
    "[API /events/create] Checking for existing active event code in app_state",
  );
  const { data: stateRow } = await supabase
    .from("app_state")
    .select("active_event_code")
    .eq("id", 1)
    .maybeSingle();

  console.log("[API /events/create] Current app_state:", stateRow);
  const activeCode = stateRow?.active_event_code;

  if (activeCode) {
    console.log(
      "[API /events/create] Active code found:",
      activeCode,
      "- checking if event is still active",
    );
    const { data: currentEv } = await supabase
      .from("events")
      .select("id, is_active")
      .eq("event_code", activeCode)
      .maybeSingle();
    console.log("[API /events/create] Current event:", currentEv);

    if (currentEv?.is_active) {
      console.log(
        "[API /events/create] Event is still active, marking it as inactive",
      );
      // Instead of rejecting, automatically end the orphaned event
      await supabase
        .from("events")
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentEv.id);
      console.log("[API /events/create] Marked previous event as inactive");
    }
    console.log(
      "[API /events/create] Clearing inactive event code from app_state",
    );
    await supabase
      .from("app_state")
      .update({
        active_event_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
  }

  console.log("[API /events/create] Checking for orphaned active events");
  const { data: orphanActive } = await supabase
    .from("events")
    .select("id, event_code")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (orphanActive) {
    console.log(
      "[API /events/create] Found orphaned active event:",
      orphanActive.event_code,
      "- marking as inactive",
    );
    await supabase
      .from("events")
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orphanActive.id);
    console.log("[API /events/create] Marked orphaned event as inactive");
  }

  let eventCode = generateEventCode();
  console.log("[API /events/create] Generated initial event code:", eventCode);

  for (let attempt = 0; attempt < 8; attempt++) {
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("event_code", eventCode)
      .maybeSingle();
    if (!existing) {
      console.log("[API /events/create] Event code is unique");
      break;
    }
    eventCode = generateEventCode();
    console.log(
      "[API /events/create] Event code collision, regenerated:",
      eventCode,
    );
  }

  console.log("[API /events/create] Creating event with code:", eventCode);
  const { data: ev, error: insertErr } = await supabase
    .from("events")
    .insert({ event_code: eventCode, is_active: true })
    .select("id, event_code")
    .single();

  console.log("[API /events/create] Event insert result:", { ev, insertErr });

  if (insertErr || !ev) {
    console.error("[API /events/create] Failed to insert event:", insertErr);
    return jsonErr(insertErr?.message ?? "Failed to create event", 500);
  }

  console.log(
    "[API /events/create] Upserting app_state with new active_event_code",
  );
  const { error: stateErr } = await supabase.from("app_state").upsert(
    {
      id: 1,
      current_phase: 1,
      total_groups: 0,
      groups_submitted: 0,
      active_event_code: eventCode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  console.log("[API /events/create] app_state upsert error:", stateErr);

  if (stateErr) {
    console.error("[API /events/create] Failed to update app_state");
    return jsonErr(stateErr.message, 500);
  }

  const joinUrl = `${appUrl.replace(/\/$/, "")}/join/${ev.event_code}`;
  const payload = {
    eventId: ev.id,
    eventCode: ev.event_code,
    joinUrl,
  };

  console.log(
    "[API /events/create] Broadcasting EVENT_STARTED with payload:",
    payload,
  );
  await realtimeBroadcastFire(SOCKET_EVENTS.EVENT_STARTED, payload);
  await realtimeBroadcastFire(SOCKET_EVENTS.PARTICIPANT_COUNT, { count: 0 });
  await realtimeBroadcastFire(SOCKET_EVENTS.PHASE_CHANGED, { phase: 1 });

  console.log(
    "[API /events/create] Successfully created event and broadcasted",
  );
  return jsonOk(payload);
}
