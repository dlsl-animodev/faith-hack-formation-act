"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { GroupProgressBar } from "@/components/host/GroupProgressBar";

interface PhasePuzzleViewerProps {
  groupName: string;
  groupColor: string;
  groupId: string;
  submitted: number;
  total: number;
  locked: boolean;
}

export function PhasePuzzleViewer({
  groupName,
  groupColor,
  groupId: _groupId,
  submitted,
  total,
  locked,
}: PhasePuzzleViewerProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <header className="space-y-2">
        <p className="font-mono text-xs text-[var(--text-muted)]">phase_05 // puzzle</p>
        <h1 className="font-display text-3xl tracking-tight">Assembly in progress</h1>
      </header>

      <GroupProgressBar submitted={submitted} total={total} />

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-[var(--text-muted)]">your_node</p>
            <p className="font-display text-xl" style={{ color: groupColor }}>
              {groupName}
            </p>
          </div>
          {locked && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-full bg-[var(--accent-success)]/20 px-3 py-1 font-mono text-xs text-[var(--accent-success)]"
            >
              locked_in
            </motion.span>
          )}
        </div>
        <div
          className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)] font-mono text-xs text-[var(--text-muted)]"
          style={{
            boxShadow: locked ? `0 0 32px ${groupColor}44` : undefined,
          }}
        >
          {locked
            ? "Your piece is seated in the master grid on the projector."
            : "Waiting for deploy signals from teams…"}
        </div>
      </Card>
    </motion.div>
  );
}
