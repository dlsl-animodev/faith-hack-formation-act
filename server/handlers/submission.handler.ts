import type { Server, Socket } from "socket.io";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import { performGroupDebugSubmit } from "@/lib/perform-group-submit";

interface SubmitDebugPayload {
  sessionId: string;
  groupId: string;
  summary: string;
}

export function registerSubmissionHandler(
  io: Server,
  socket: Socket,
  supabase: SupabaseClient
): void {
  socket.on(
    SOCKET_EVENTS.SUBMIT_DEBUG,
    async (payload: SubmitDebugPayload, ack?: (err: string | null) => void) => {
      const reply = (err: string | null) => {
        if (typeof ack === "function") ack(err);
      };

      try {
        const result = await performGroupDebugSubmit(supabase, io, {
          sessionId: payload?.sessionId ?? "",
          groupId: payload?.groupId ?? "",
          summary: payload?.summary ?? "",
        });
        if (!result.ok) {
          reply(result.error);
          return;
        }
        reply(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Submit failed";
        reply(msg);
      }
    }
  );
}
