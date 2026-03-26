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
            className={`relative flex min-h-[72px] flex-col justify-between rounded-xl border p-3 font-mono text-[10px] uppercase tracking-wide sm:min-h-[96px] sm:text-xs ${
              ghost
                ? "border-dashed border-[var(--border)] bg-[var(--bg-surface)]/60 text-[var(--text-muted)]"
                : locked
                ? "border-purple-500 bg-yellow-600 text-black"
                : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
            }`}
            style={{
              borderColor: locked ? "rgb(168 85 247)" : p.groupColor ?? undefined,
              boxShadow: locked && p.groupColor 
                ? `0 0 32px ${p.groupColor}66, 0 0 64px ${p.groupColor}33, inset 0 0 20px ${p.groupColor}22`
                : ghost 
                ? "none"
                : p.groupColor 
                ? `0 0 16px ${p.groupColor}44` 
                : undefined,
            }}
          >
            {locked && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-2 right-2"
              >
                <svg 
                  className="h-3 w-3 text-[var(--accent-primary)]" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.div>
            )}
            
            <div className="flex flex-col justify-between h-full">
              <span className={`truncate ${locked ? 'font-semibold' : ''}`}>
                {p.groupName ?? "awaiting"}
              </span>
              
              <div className="flex items-center justify-between">
                <span className={`text-[var(--text-muted)] ${locked ? 'text-[var(--accent-primary)] font-semibold' : ''}`}>
                  {locked ? "locked" : ghost ? "ghost" : "pending"}
                </span>
                
                {locked && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "auto" }}
                    className="flex items-center gap-1"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                    <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse delay-75" />
                    <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse delay-150" />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
