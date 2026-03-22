"use client";

import { create } from "zustand";

export interface EventShellState {
  participantCount: number;
  eventEnded: boolean;
  completionTitle: string | null;
  completionBody: string | null;
  setParticipantCount: (n: number) => void;
  setEventEnded: (v: boolean) => void;
  setCompletion: (title: string, body: string) => void;
  reset: () => void;
}

export const useEventShellStore = create<EventShellState>((set) => ({
  participantCount: 0,
  eventEnded: false,
  completionTitle: null,
  completionBody: null,
  setParticipantCount: (participantCount) => set({ participantCount }),
  setEventEnded: (eventEnded) => set({ eventEnded }),
  setCompletion: (title, body) =>
    set({ completionTitle: title, completionBody: body }),
  reset: () =>
    set({
      participantCount: 0,
      eventEnded: false,
      completionTitle: null,
      completionBody: null,
    }),
}));
