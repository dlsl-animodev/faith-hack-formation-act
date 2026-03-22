"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { EventSummary } from "@/types";
import { Tag } from "@/components/ui/Tag";

interface EventRow {
  id: string;
  event_code: string;
  created_at: string;
  ended_at: string | null;
  summary: EventSummary | null;
}

interface EventHistoryCardProps {
  event: EventRow;
}

export function EventHistoryCard({ event }: EventHistoryCardProps) {
  const [open, setOpen] = useState(false);
  const summary = event.summary;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <div>
          <p className="font-mono text-sm text-[var(--accent-primary)]">{event.event_code}</p>
          <p className="font-mono text-xs text-[var(--text-muted)]">
            {new Date(event.created_at).toLocaleString()}
          </p>
        </div>
        <span className="font-mono text-xs text-[var(--text-secondary)]">{open ? "−" : "+"}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[var(--border)] px-4 py-3"
          >
            {!summary ? (
              <p className="font-mono text-xs text-[var(--text-muted)]">No summary captured.</p>
            ) : (
              <div className="space-y-4">
                <p className="font-mono text-xs text-[var(--text-secondary)]">
                  participants: {summary.totalParticipants} · groups: {summary.totalGroups}
                </p>
                <ul className="space-y-3">
                  {summary.groups.map((g) => (
                    <li
                      key={`${event.id}-${g.name}`}
                      className="rounded-lg bg-[var(--bg-surface)] p-3 font-body text-sm text-[var(--text-secondary)]"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Tag label={g.name} color={g.color} />
                        <span className="font-mono text-xs text-[var(--text-muted)]">
                          {g.memberCount} members
                        </span>
                      </div>
                      <p className="font-mono text-xs text-[var(--accent-warm)]">debug</p>
                      <p className="mb-2 whitespace-pre-wrap">{g.debugSummary || "—"}</p>
                      <p className="font-mono text-xs text-[var(--accent-success)]">message</p>
                      <p className="whitespace-pre-wrap">{g.completionMessage || "—"}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
