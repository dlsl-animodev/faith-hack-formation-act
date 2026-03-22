"use client";

import { io, type Socket } from "socket.io-client";

const sockets = new Map<string, Socket>();

function socketUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
}

function authKey(auth: Record<string, unknown> | undefined): string {
  return JSON.stringify(auth ?? {});
}

export function getSocket(auth?: Record<string, unknown>): Socket {
  const key = authKey(auth);
  let s = sockets.get(key);
  if (s) {
    if (!s.connected) s.connect();
    return s;
  }
  s = io(socketUrl(), {
    autoConnect: true,
    transports: ["websocket", "polling"],
    auth: auth ?? {},
  });
  sockets.set(key, s);
  return s;
}

export function disconnectSocketAuth(auth?: Record<string, unknown>): void {
  const key = authKey(auth);
  const s = sockets.get(key);
  s?.disconnect();
  sockets.delete(key);
}
