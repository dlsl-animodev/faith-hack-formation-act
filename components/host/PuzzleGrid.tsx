"use client";

import { motion } from "framer-motion";
import type { PuzzlePiece } from "@/types";

interface PuzzleGridProps {
  pieces: PuzzlePiece[];
  cols: number;
  rows: number;
  lockedIds: Set<string>;
  large?: boolean;
}

export function PuzzleGrid({ pieces, cols, rows, lockedIds, large }: PuzzleGridProps) {
  const gap = large ? "gap-4" : "gap-2";
  return (
    <div
      className={`grid ${gap}`}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {pieces.map((p) => {
        const locked = p.groupId ? lockedIds.has(p.groupId) : false;
        const ghost = !p.groupId;
        return (
          <motion.div
            key={p.id}
            layoutId={p.groupId ? `piece-${p.groupId}` : p.id}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className={`flex min-h-[72px] flex-col justify-between rounded-xl border p-3 font-mono text-[10px] uppercase tracking-wide sm:min-h-[96px] sm:text-xs ${
              ghost
                ? "border-dashed border-[var(--border)] bg-[var(--bg-surface)]/60 text-[var(--text-muted)]"
                : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
            }`}
            style={{
              borderColor: p.groupColor ?? undefined,
              boxShadow: locked && p.groupColor ? `0 0 24px ${p.groupColor}44` : undefined,
            }}
          >
            <span className="truncate">{p.groupName ?? "awaiting"}</span>
            <span className="text-[var(--text-muted)]">
              {locked ? "locked" : ghost ? "ghost" : "pending"}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
