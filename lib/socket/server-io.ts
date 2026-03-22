import type { Server as IOServer } from "socket.io";

declare global {
  // eslint-disable-next-line no-var
  var __faithHackIo: IOServer | undefined;
}

export function setSocketServer(io: IOServer): void {
  globalThis.__faithHackIo = io;
}

export function getSocketServer(): IOServer | undefined {
  return globalThis.__faithHackIo;
}
