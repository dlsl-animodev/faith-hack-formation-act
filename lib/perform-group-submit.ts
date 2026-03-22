import type { Server } from "socket.io";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import { completionMessageForGroupIndex } from "@/lib/messages";
import { sanitizeText } from "@/lib/sanitize";
import { buildPuzzleGrid } from "@/lib/puzzle";

export interface SubmitDebugInput {
  sessionId: string;
  groupId: string;
  summary: string;
}

export async function performGroupDebugSubmit(
  supabase: SupabaseClient,
  io: Server | null | undefined,
  input: SubmitDebugInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const summary = sanitizeText(input.summary ?? "", 8000);
  if (!summary) {
    return { ok: false, error: "Summary required" };
  }

  const { data: session, error: se } = await supabase
    .from("sessions")
    .select("id, group_id, is_leader, event_id")
    .eq("id", input.sessionId)
    .single();

  if (se || !session || session.group_id !== input.groupId) {
    return { ok: false, error: "Unauthorized" };
  }

  if (!session.is_leader) {
    return { ok: false, error: "Only the team leader can submit" };
  }

  const { data: group, error: ge } = await supabase
    .from("groups")
    .select("id, event_id, name, color, submitted")
    .eq("id", input.groupId)
    .single();

  if (ge || !group || group.submitted) {
    return { ok: false, error: "Invalid group" };
  }

  const { data: eventRow } = await supabase
    .from("events")
    .select("event_code")
    .eq("id", group.event_id)
    .single();

  const { data: orderedGroups } = await supabase
    .from("groups")
    .select("id")
    .eq("event_id", group.event_id)
    .order("created_at", { ascending: true });

  const groupIndex = orderedGroups?.findIndex((g) => g.id === group.id) ?? 0;
  const message = completionMessageForGroupIndex(groupIndex);

  const { error: upG } = await supabase
    .from("groups")
    .update({
      submitted: true,
      debug_summary: summary,
      completion_message: `${message.title}\n\n${message.body}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", group.id);

  if (upG) {
    return { ok: false, error: upG.message };
  }

  const { count: total, error: totalErr } = await supabase
    .from("groups")
    .select("id", { count: "exact", head: true })
    .eq("event_id", group.event_id);

  if (totalErr) {
    return { ok: false, error: totalErr.message };
  }

  const { count: submittedCount, error: subErr } = await supabase
    .from("groups")
    .select("id", { count: "exact", head: true })
    .eq("event_id", group.event_id)
    .eq("submitted", true);

  if (subErr) {
    return { ok: false, error: subErr.message };
  }

  const totalGroups = total ?? 0;
  const nextSubmitted = submittedCount ?? 0;

  const { data: appState } = await supabase
    .from("app_state")
    .select("active_event_code")
    .eq("id", 1)
    .single();

  await supabase
    .from("app_state")
    .update({
      total_groups: totalGroups,
      groups_submitted: nextSubmitted,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  const { data: meta } = await supabase
    .from("groups")
    .select("id, name, color")
    .eq("event_id", group.event_id)
    .order("created_at", { ascending: true });

  const grid = buildPuzzleGrid(
    meta?.length ?? 0,
    (meta ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      color: m.color,
    }))
  );

  const eventCode = eventRow?.event_code ?? appState?.active_event_code;

  if (io && eventCode) {
    io.to(`event:${eventCode}`).emit(SOCKET_EVENTS.GROUP_SUBMITTED, {
      groupId: group.id,
      groupName: group.name,
      groupColor: group.color,
      groupIndex,
      cols: grid.cols,
      rows: grid.rows,
      completionMessage: message.body,
      submittedCount: nextSubmitted,
      totalGroups: totalGroups,
    });

    io.to(`event:${eventCode}`).emit(SOCKET_EVENTS.PUZZLE_PIECE_LOCKED, {
      groupId: group.id,
      groupIndex,
      cols: grid.cols,
      rows: grid.rows,
    });
  }

  if (totalGroups > 0 && nextSubmitted >= totalGroups) {
    await supabase
      .from("app_state")
      .update({
        current_phase: 6,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (io && eventCode) {
      io.to(`event:${eventCode}`).emit(SOCKET_EVENTS.ALL_GROUPS_SUBMITTED, {});
      io.to(`event:${eventCode}`).emit(SOCKET_EVENTS.PHASE_CHANGED, { phase: 6 });
    }

    const { data: allGroups } = await supabase
      .from("groups")
      .select("id, completion_message")
      .eq("event_id", group.event_id);

    if (io) {
      for (const g of allGroups ?? []) {
        if (!g.completion_message) continue;
        const lines = g.completion_message.split("\n\n");
        const title = lines[0] ?? "";
        const body = lines.slice(1).join("\n\n");
        io.to(`group:${g.id}`).emit(SOCKET_EVENTS.COMPLETION_MESSAGE, {
          groupId: g.id,
          title,
          body,
        });
      }
    }
  }

  return { ok: true };
}
