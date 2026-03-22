"use client";

import { create } from "zustand";
import type { PhaseNumber } from "@/types";

export interface PhaseState {
  phase: PhaseNumber;
  setPhase: (p: PhaseNumber) => void;
}

export const usePhaseStore = create<PhaseState>((set) => ({
  phase: 1,
  setPhase: (phase) => set({ phase }),
}));
