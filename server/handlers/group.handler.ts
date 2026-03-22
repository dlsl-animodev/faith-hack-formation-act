import type { Server, Socket } from "socket.io";

/** Reserved for future group-scoped broadcasts; session join covers assignment. */
export function registerGroupHandler(_io: Server, _socket: Socket): void {
  /* no-op */
}
