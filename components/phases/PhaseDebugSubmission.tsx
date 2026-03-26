"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";

interface PhaseDebugSubmissionProps {
  sessionId: string;
  groupId: string;
  isLeader: boolean;
}

export function PhaseDebugSubmission({
  sessionId,
  groupId,
  isLeader,
}: PhaseDebugSubmissionProps) {
  const [summary, setSummary] = useState("");
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, summary }),
      });
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data &&
        "success" in data &&
        (data as { success: boolean }).success
      ) {
        setDone(true);
      } else {
        const err =
          typeof data === "object" &&
          data &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Submit failed";
        setError(err);
      }
    } catch {
      setError("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLeader) {
    return (
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <header className="space-y-2">
          <p className="font-mono text-xs text-[var(--text-muted)]">phase_04 // deploy</p>
          <h1 className="font-display text-3xl tracking-tight">Stand by</h1>
        </header>
        <Card className="flex flex-col items-center gap-4 py-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
            className="h-12 w-12 rounded-full border-2 border-[var(--border)] border-t-[var(--accent-primary)]"
          />
          <p className="text-center font-body text-sm text-[var(--text-secondary)]">
            Your team leader is submitting your debug summary…
          </p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <header className="space-y-2">
        <p className="font-mono text-xs text-[var(--text-muted)]">phase_04 // deploy</p>
        <h1 className="font-display text-3xl tracking-tight">Ship the summary</h1>
        <p className="text-sm text-[var(--text-secondary)] select-none touch-none">
          Leader only: capture what surfaced as a group. Click deploy to confirm.
        </p>
      </header>

      <Card className="space-y-5">
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          disabled={done}
          rows={6}
          placeholder="// What did we learn? What are we handing to God?"
          className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 font-mono text-sm text-[var(--text-primary)] outline-none ring-[var(--accent-primary)] focus:ring-2"
        />

        <div className="flex flex-col items-center gap-4 py-4">
          <button
            type="button"
            disabled={done || isSubmitting || !summary.trim()}
            onClick={submit}
            className={`flex h-24 w-24 items-center justify-center rounded-full bg-[var(--accent-primary)] font-mono text-xs font-semibold uppercase tracking-widest text-[var(--bg-base)] transition-all focus:outline-none ${
              !done && !isSubmitting && !summary.trim() ? "opacity-40" : "hover:scale-105 active:scale-95 cursor-pointer"
            }`}
          >
            {done ? (
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                <svg className="h-6 w-6 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            ) : isSubmitting ? (
              <motion.div className="flex flex-col items-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-6 w-6 rounded-full border-2 border-[var(--bg-base)] border-t-transparent"
                />
              </motion.div>
            ) : null}
          </button>
          <p className="font-mono text-xs text-[var(--text-muted)] select-none touch-none">
            {done ? "Submission complete." : isSubmitting ? "Submitting..." : (
              <>
                click to deploy <span className="animate-cursor">▍</span>
              </>
            )}
          </p>
        </div>

        {error && <p className="font-mono text-xs text-red-400">{error}</p>}
      </Card>
    </motion.div>
  );
}
