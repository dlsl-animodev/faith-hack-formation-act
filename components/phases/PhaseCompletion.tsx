"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";

interface PhaseCompletionProps {
  title: string;
  body: string;
}

export function PhaseCompletion({ title, body }: PhaseCompletionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9 }}
      className="space-y-8"
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 120 }}
          className="relative flex h-48 w-48 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_20%,var(--accent-warm),transparent_55%),radial-gradient(circle_at_70%_80%,var(--accent-primary),transparent_50%)] opacity-90 blur-0"
        >
          <div className="absolute inset-6 rounded-full border border-white/20 bg-[var(--bg-card)]/80 shadow-glow backdrop-blur-sm" />
          <span className="relative font-display text-4xl text-[var(--text-primary)]">✶</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="w-full"
        >
          <Card className="space-y-4 text-left">
            <p className="font-mono text-xs text-[var(--text-muted)]">completion_packet</p>
            <h1 className="font-display text-3xl text-[var(--accent-success)]">{title}</h1>
            <p className="font-body text-base leading-relaxed text-[var(--text-secondary)]">{body}</p>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
