import type { PuzzlePiece } from "@/types";

export interface PuzzleGridResult {
  pieces: PuzzlePiece[];
  cols: number;
  rows: number;
}

function gridDimensions(totalGroups: number): { cols: number; rows: number } {
  if (totalGroups <= 0) {
    return { cols: 1, rows: 1 };
  }
  const cols = Math.ceil(Math.sqrt(totalGroups));
  const rows = Math.ceil(totalGroups / cols);
  return { cols, rows };
}

/** Builds placeholder grid: first `totalGroups` cells map to `groupMeta` order; rest are ghosts. */
export function buildPuzzleGrid(
  totalGroups: number,
  groupMeta: Array<{ id: string; name: string; color: string }>
): PuzzleGridResult {
  const { cols, rows } = gridDimensions(totalGroups);
  const slots = cols * rows;
  const pieces: PuzzlePiece[] = [];

  for (let i = 0; i < slots; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const meta = i < totalGroups ? groupMeta[i] : undefined;
    pieces.push({
      id: `piece-${i}`,
      groupIndex: i,
      groupId: meta?.id ?? null,
      groupName: meta?.name ?? null,
      groupColor: meta?.color ?? null,
      col,
      row,
      locked: false,
    });
  }

  return { pieces, cols, rows };
}
