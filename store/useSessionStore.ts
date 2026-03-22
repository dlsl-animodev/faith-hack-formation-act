"use client";

import { create } from "zustand";

export interface SessionState {
  sessionId: string | null;
  eventCode: string | null;
  displayName: string | null;
  setSession: (id: string | null) => void;
  setEventCode: (code: string | null) => void;
  setDisplayName: (name: string | null) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  eventCode: null,
  displayName: null,
  setSession: (sessionId) => set({ sessionId }),
  setEventCode: (eventCode) => set({ eventCode }),
  setDisplayName: (displayName) => set({ displayName }),
  reset: () =>
    set({ sessionId: null, eventCode: null, displayName: null }),
}));
