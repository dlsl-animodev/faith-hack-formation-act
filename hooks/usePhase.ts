"use client";

import { usePhaseStore } from "@/store/usePhaseStore";

export function usePhase() {
  const phase = usePhaseStore((s) => s.phase);
  const setPhase = usePhaseStore((s) => s.setPhase);
  return { phase, setPhase };
}
