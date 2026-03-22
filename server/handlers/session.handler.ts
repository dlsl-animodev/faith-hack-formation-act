import type { Server, Socket } from "socket.io";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import type {
  SocketGroupAssignedPayload,
  SocketSessionPayload,
} from "@/types";

export function registerSessionHandler(
  io: Server,
  socket: Socket,
  supabase: SupabaseClient
): void {
  socket.on(
    SOCKET_EVENTS.JOIN_SESSION,
    async (payload: SocketSessionPayload, ack?: (err: string | null) => void) => {
      const reply = (err: string | null) => {
        if (typeof ack === "function") ack(err);
      };

      try {
        if (!payload?.sessionId || !payload?.eventCode) {
          reply("Invalid join payload");
          return;
        }

        const { data: session, error: sessionError } = await supabase
          .from("sessions")
          .select("id, group_id, event_id, position, is_leader")
          .eq("id", payload.sessionId)
          .single();

        if (sessionError || !session?.group_id) {
          reply("Session not found or not assigned");
          return;
        }

        const { data: ev, error: evError } = await supabase
          .from("events")
          .select("id, event_code, is_active")
          .eq("event_code", payload.eventCode)
          .single();

        if (evError || !ev?.is_active || ev.id !== session.event_id) {
          reply("Invalid or inactive event");
          return;
        }

        const { data: group, error: groupError } = await supabase
          .from("groups")
          .select("id, name, color")
          .eq("id", session.group_id)
          .single();

        if (groupError || !group) {
          reply("Group not found");
          return;
        }

        const { count, error: countError } = await supabase
          .from("sessions")
          .select("id", { count: "exact", head: true })
          .eq("group_id", group.id);

        if (countError) {
          reply(countError.message);
          return;
        }

        const memberCount = count ?? 0;

        socket.data.sessionId = session.id;
        socket.data.eventCode = payload.eventCode;
        socket.data.groupId = group.id;
        socket.data.role = "participant";

        await socket.join(`event:${payload.eventCode}`);
        await socket.join(`group:${group.id}`);
        await socket.join(`session:${session.id}`);

        socket.emit(SOCKET_EVENTS.SESSION_JOINED, { sessionId: session.id });

        const assigned: SocketGroupAssignedPayload = {
          groupId: group.id,
          groupName: group.name,
          groupColor: group.color,
          position: session.position,
          memberCount,
        };
        socket.emit(SOCKET_EVENTS.GROUP_ASSIGNED, assigned);

        const { count: pCount } = await supabase
          .from("sessions")
          .select("id", { count: "exact", head: true })
          .eq("event_id", ev.id);

        io.to(`event:${payload.eventCode}`).emit(SOCKET_EVENTS.PARTICIPANT_COUNT, {
          count: pCount ?? 0,
        });

        reply(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Join failed";
        reply(msg);
      }
    }
  );
}
