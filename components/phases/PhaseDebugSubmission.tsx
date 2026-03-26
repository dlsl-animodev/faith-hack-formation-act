"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";

const HOLD_MS = 3000;

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
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const holdStart = useRef<number | null>(null);
  const raf = useRef<number | null>(null);
  const summaryRef = useRef(summary);
  summaryRef.current = summary;

  const clearRaf = () => {
    if (raf.current != null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
  };

  const tick = useCallback(() => {
    if (holdStart.current == null) return;
    const elapsed = Date.now() - holdStart.current;
    const p = Math.min(1, elapsed / HOLD_MS);
    setProgress(p);
    if (p >= 1) {
      clearRaf();
      setHolding(false);
      setProgress(0);
      void submit(summaryRef.current);
      return;
    }
    raf.current = requestAnimationFrame(tick);
    // tick only reads summaryRef + submit; submit is stable enough for hold animation
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hold loop uses refs
  }, []);

  useEffect(() => {
    return () => clearRaf();
  }, []);

  const submit = async (text: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, summary: text }),
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

  const startHold = () => {
    if (!summary.trim() || done) return;
    setHolding(true);
    holdStart.current = Date.now();
    raf.current = requestAnimationFrame(tick);
  };

  const endHold = () => {
    if (!holding) return;
    clearRaf();
    holdStart.current = null;
    setHolding(false);
    setProgress(0);
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
        <p className="text-sm text-[var(--text-secondary)] select-none touch none">
          Leader only: capture what surfaced as a group. Hold the deploy control for 3 seconds to confirm.
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

        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <ProgressRing progress={progress} size={132} stroke={10} />
            <button
              type="button"
              disabled={done || isSubmitting || !summary.trim()}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId); 
                startHold();
              }}
              onPointerUp={(e) => {
                e.currentTarget.releasePointerCapture(e.pointerId);
                endHold();
}}
onPointerCancel={endHold}
              className={`absolute flex h-24 w-24 items-center justify-center rounded-full bg-[var(--accent-primary)] font-mono text-xs font-semibold uppercase tracking-widest text-[var(--bg-base)] transition-opacity focus:outline-none ${(!done && !isSubmitting && !summary.trim()) ? 'opacity-40' : ''}`}
            >
              {done ? (
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                  <svg className="h-6 w-6 text-green-200 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>done</span>
                </motion.div>
              ) : isSubmitting ? (
                <motion.div className="flex flex-col items-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="h-6 w-6 rounded-full border-2 border-[var(--bg-base)] border-t-transparent mb-1"
                  />
                  <span className="text-xs">sending</span>
                </motion.div>
              ) : (
                "hold"
              )}
            </button>
          </div>
          <p className="font-mono text-xs text-[var(--text-muted)] select-none touch-none">
            {done ? "Submission complete." : isSubmitting ? "Submitting..." : (
              <>
                press & hold 3s <span className="animate-cursor">▍</span>
              </>
            )}
          </p>
        </div>

        {error && <p className="font-mono text-xs text-red-400">{error}</p>}
      </Card>
    </motion.div>
  );
}
