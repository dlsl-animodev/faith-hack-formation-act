"use client";

interface GroupProgressBarProps {
  submitted: number;
  total: number;
}

export function GroupProgressBar({ submitted, total }: GroupProgressBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((submitted / total) * 100)) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between font-mono text-xs text-[var(--text-muted)]">
        <span>groups_deployed</span>
        <span>
          {submitted} / {total}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface)]">
        <div
          className="h-full rounded-full bg-[var(--accent-success)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
