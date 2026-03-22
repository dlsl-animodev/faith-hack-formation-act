"use client";

import { create } from "zustand";
import type { PuzzlePiece } from "@/types";

export interface PuzzleState {
  pieces: PuzzlePiece[];
  cols: number;
  rows: number;
  lockedIds: Set<string>;
  setGrid: (pieces: PuzzlePiece[], cols: number, rows: number) => void;
  lockPiece: (groupId: string) => void;
  reset: () => void;
}

export const usePuzzleStore = create<PuzzleState>((set, get) => ({
  pieces: [],
  cols: 1,
  rows: 1,
  lockedIds: new Set(),
  setGrid: (pieces, cols, rows) =>
    set({
      pieces,
      cols,
      rows,
      lockedIds: new Set(),
    }),
  lockPiece: (groupId) => {
    const next = new Set(get().lockedIds);
    next.add(groupId);
    set({
      lockedIds: next,
      pieces: get().pieces.map((p) =>
        p.groupId === groupId ? { ...p, locked: true } : p
      ),
    });
  },
  reset: () =>
    set({
      pieces: [],
      cols: 1,
      rows: 1,
      lockedIds: new Set(),
    }),
}));
