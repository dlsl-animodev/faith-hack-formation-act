"use client";

import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";

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

interface SessionStatePanelProps {
  eventCode?: string | null;
  phase: number;
  participantCount: number;
  submitted: number;
  total: number;
  groups: HostStateGroup[];
}

function labelForPhase(phase: number): string {
  switch (phase) {
    case 1:
      return "formation";
    case 2:
      return "private bugs";
    case 3:
      return "group sharing";
    case 4:
      return "debug summary";
    case 5:
      return "puzzle assembly";
    case 6:
      return "completion";
    default:
      return "formation";
  }
}

function labelForState(state: string): string {
  switch (state) {
    case "formation":
      return "forming";
    case "private_bugs":
      return "collecting bugs";
    case "sharing":
      return "sharing";
    case "drafting_submission":
      return "drafting summary";
    case "puzzle_locking":
      return "awaiting lock";
    case "submitted":
      return "submitted";
    case "completion":
      return "completion";
    case "complete":
      return "complete";
    default:
      return state.replace(/_/g, " ");
  }
}

function clampText(input: string | null, max = 220): string | null {
  if (!input) return null;
  const text = input.trim();
  if (!text) return null;
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export function SessionStatePanel({
  eventCode,
  phase,
  participantCount,
  submitted,
  total,
  groups,
}: SessionStatePanelProps) {
  return (
    <aside className="space-y-4">
      <Card className="space-y-4">
        <p className="font-mono text-xs text-[var(--text-muted)]">
          live_session_state
        </p>

        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3">
            <p className="text-[var(--text-muted)]">event</p>
            <p className="mt-1 text-sm text-[var(--accent-primary)]">
              {eventCode ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3">
            <p className="text-[var(--text-muted)]">phase</p>
            <p className="mt-1 text-sm text-[var(--accent-warm)]">
              {phase} · {labelForPhase(phase)}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3">
            <p className="text-[var(--text-muted)]">participants</p>
            <p className="mt-1 text-sm text-[var(--text-primary)]">
              {participantCount}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3">
            <p className="text-[var(--text-muted)]">submissions</p>
            <p className="mt-1 text-sm text-[var(--accent-success)]">
              {submitted} / {total}
            </p>
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs text-[var(--text-muted)]">
            group_status
          </p>
          <p className="font-mono text-xs text-[var(--text-muted)]">
            {groups.length} groups
          </p>
        </div>

        {groups.length === 0 ? (
          <p className="font-mono text-xs text-[var(--text-muted)]">
            Waiting for teams to form…
          </p>
        ) : (
          <div className="max-h-[56vh] space-y-3 overflow-y-auto pr-2 
          [&::-webkit-scrollbar]:w-1.5 
          [&::-webkit-scrollbar-track]:bg-transparent 
          [&::-webkit-scrollbar-thumb]:rounded-full 
          [&::-webkit-scrollbar-thumb]:bg-[var(--border)] 
          hover:[&::-webkit-scrollbar-thumb]:bg-[var(--text-muted)]"
>
            {groups.map((g) => {
              const preview = clampText(g.debugSummary);
              const completionPreview = clampText(g.completionMessage, 180);
              return (
                <div
                  key={g.id}
                  className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3"
                  style={{ borderColor: g.color }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-lg leading-none text-[var(--text-primary)]">
                        {g.name}
                      </p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                        {g.memberCount} members · {g.bugCount} bugs
                      </p>
                    </div>
                    <Tag label={labelForState(g.state)} color={g.color} />
                  </div>

                  {preview ? (
                    <div className="space-y-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2">
                      <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                        latest submission
                      </p>
                      <p className="whitespace-pre-wrap font-body text-xs leading-relaxed text-[var(--text-secondary)]">
                        {preview}
                      </p>
                    </div>
                  ) : (
                    <p className="font-mono text-[10px] text-[var(--text-muted)]">
                      No summary submitted yet.
                    </p>
                  )}

                  {completionPreview ? (
                    <details className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2">
                      <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                        completion message
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap font-body text-xs leading-relaxed text-[var(--text-secondary)]">
                        {completionPreview}
                      </p>
                    </details>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </aside>
  );
}
