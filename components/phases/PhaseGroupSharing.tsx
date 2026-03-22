"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";

interface PhaseGroupSharingProps {
  position: number;
  prompt: string;
}

export function PhaseGroupSharing({ position, prompt }: PhaseGroupSharingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="space-y-2">
        <p className="font-mono text-xs text-[var(--text-muted)]">phase_03 // sharing</p>
        <h1 className="font-display text-3xl tracking-tight">Your turn in the stack</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          No buttons to rush you — follow the facilitator. This is your prompt when you speak.
        </p>
      </header>

      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-surface)] font-display text-xl text-[var(--accent-primary)]">
            {position}
          </div>
          <div>
            <p className="font-mono text-xs text-[var(--text-muted)]">speaker_order</p>
            <p className="font-body text-sm text-[var(--text-secondary)]">
              You are #{position} in your group rotation.
            </p>
          </div>
        </div>
        <p className="font-body text-lg leading-relaxed text-[var(--text-primary)]">{prompt}</p>
      </Card>
    </motion.div>
  );
}
