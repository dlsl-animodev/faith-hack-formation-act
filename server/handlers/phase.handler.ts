import type { Server, Socket } from "socket.io";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import { promptForPosition } from "@/lib/sharing-prompts";
import type { PhaseNumber } from "@/types";

function assertAdmin(socket: Socket): boolean {
  return socket.data.isAdmin === true;
}

async function seedSharingPrompts(
  supabase: SupabaseClient,
  eventCode: string
): Promise<void> {
  const { data: ev } = await supabase
    .from("events")
    .select("id")
    .eq("event_code", eventCode)
    .single();
  if (!ev) return;

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, group_id, position")
    .eq("event_id", ev.id)
    .not("group_id", "is", null);

  if (!sessions?.length) return;

  const sessionIds = sessions.map((s) => s.id);
  if (sessionIds.length > 0) {
    const { error: delErr } = await supabase
      .from("sharing_prompts")
      .delete()
      .in("session_id", sessionIds);
    if (delErr) throw new Error(delErr.message);
  }

  const rows = sessions.map((s) => ({
    session_id: s.id,
    group_id: s.group_id as string,
    position: s.position,
    prompt_text: promptForPosition(s.position),
  }));

  const { error } = await supabase.from("sharing_prompts").insert(rows);
  if (error) throw new Error(error.message);
}

export function registerPhaseHandler(
  io: Server,
  socket: Socket,
  supabase: SupabaseClient
): void {
  socket.on(SOCKET_EVENTS.ADMIN_ADVANCE_PHASE, async () => {
    if (!assertAdmin(socket)) return;

    const { data: state } = await supabase
      .from("app_state")
      .select("current_phase, active_event_code")
      .eq("id", 1)
      .single();

    if (!state?.active_event_code) return;

    const next = Math.min(6, Math.max(1, (state.current_phase ?? 1) + 1)) as PhaseNumber;

    if (next === 3) {
      await seedSharingPrompts(supabase, state.active_event_code);
    }

    await supabase
      .from("app_state")
      .update({ current_phase: next, updated_at: new Date().toISOString() })
      .eq("id", 1);

    io.to(`event:${state.active_event_code}`).emit(SOCKET_EVENTS.PHASE_CHANGED, {
      phase: next,
    });
    socket.emit(SOCKET_EVENTS.PHASE_CHANGED, { phase: next });
  });

  socket.on(SOCKET_EVENTS.ADMIN_END_SHARING, async () => {
    if (!assertAdmin(socket)) return;

    const { data: state } = await supabase
      .from("app_state")
      .select("active_event_code")
      .eq("id", 1)
      .single();

    if (!state?.active_event_code) return;

    const phase = 4 as PhaseNumber;

    await supabase
      .from("app_state")
      .update({ current_phase: phase, updated_at: new Date().toISOString() })
      .eq("id", 1);

    io.to(`event:${state.active_event_code}`).emit(SOCKET_EVENTS.PHASE_CHANGED, {
      phase,
    });
    socket.emit(SOCKET_EVENTS.PHASE_CHANGED, { phase });
  });
}
