"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { BugSelection } from "@/components/phases/PhaseBugChecklist";
import { PhaseBugChecklist } from "@/components/phases/PhaseBugChecklist";

interface BugsDrawerProps {
  sessionId: string;
  initialBugs: BugSelection[];
}

export function BugsDrawer({ sessionId, initialBugs }: BugsDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-40 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 font-mono text-xs uppercase tracking-widest text-[var(--accent-primary)] shadow-glow"
      >
        bugs_panel
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            className="fixed inset-x-0 bottom-0 z-30 max-h-[85vh] overflow-y-auto rounded-t-3xl border border-[var(--border)] bg-[var(--bg-base)] p-4 pb-24 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]"
          >
            <div className="mx-auto max-w-lg">
              <PhaseBugChecklist sessionId={sessionId} initialSelected={initialBugs} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
