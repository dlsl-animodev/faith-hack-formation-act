"use client";

import { AnimatePresence, motion } from "framer-motion";
import { QRDisplay } from "@/components/host/QRDisplay";
import { PuzzleGrid } from "@/components/host/PuzzleGrid";
import { GroupProgressBar } from "@/components/host/GroupProgressBar";
import { SessionStatePanel } from "@/components/host/SessionStatePanel";
import type { PuzzlePiece } from "@/types";

interface HostStateGroup {
  id: string;
  name: string;
  color: string;
  submitted: boolean;
  state: string;
  memberCount: number;
  bugCount: number;
  debugSummary: string | null;
  completionMessage: string | null;
  updatedAt: string;
}

interface HostVisualizerProps {
  mode: "qr" | "puzzle" | "complete";
  eventCode?: string | null;
  joinUrl: string;
  participantCount: number;
  pieces: PuzzlePiece[];
  cols: number;
  rows: number;
  lockedIds: Set<string>;
  submitted: number;
  total: number;
  phase: number;
  groups: HostStateGroup[];
}

export function HostVisualizer({
  mode,
  eventCode,
  joinUrl,
  participantCount,
  pieces,
  cols,
  rows,
  lockedIds,
  submitted,
  total,
  phase,
  groups,
}: HostVisualizerProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-base)] px-4 py-8 text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute inset-0 animate-scan bg-[linear-gradient(to_bottom,transparent,rgba(124,106,247,0.08),transparent)]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(330px,1fr)]">
        <AnimatePresence mode="wait">
          {mode === "qr" && (
            <motion.div
              key="qr"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto w-full max-w-5xl"
            >
              <QRDisplay
                eventCode={eventCode}
                joinUrl={joinUrl}
                participantCount={participantCount}
              />
            </motion.div>
          )}

          {(mode === "puzzle" || mode === "complete") && (
            <motion.div
              key="puzzle"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex w-full flex-col gap-8"
            >
              <header className="space-y-2 text-center">
                <p className="font-mono text-xs text-[var(--text-muted)]">
                  projector_surface
                </p>
                <h1 className="font-display text-4xl md:text-5xl">
                  System assembly
                </h1>
              </header>
              <GroupProgressBar submitted={submitted} total={total} />
              <PuzzleGrid
                pieces={pieces}
                cols={cols}
                rows={rows}
                lockedIds={lockedIds}
                large
              />
            </motion.div>
          )}
        </AnimatePresence>

        <SessionStatePanel
          eventCode={eventCode}
          phase={phase}
          participantCount={participantCount}
          submitted={submitted}
          total={total}
          groups={groups}
        />
      </div>
    </div>
  );
}
