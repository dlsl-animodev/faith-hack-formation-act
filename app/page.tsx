import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-[var(--bg-base)] px-6 text-center text-[var(--text-primary)]">
      <div className="space-y-3">
        <p className="font-mono text-xs text-[var(--text-muted)]">faith_hack // launch</p>
        <h1 className="font-display text-5xl tracking-tight">Faith Hack</h1>
        <p className="max-w-md font-body text-sm text-[var(--text-secondary)]">
          Choose your surface — facilitator console or room display.
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/admin/login"
          className="rounded-xl bg-[var(--accent-primary)] px-8 py-3 font-mono text-sm font-semibold uppercase tracking-widest text-[var(--bg-base)] shadow-glow"
        >
          Admin
        </Link>
        <Link
          href="/host"
          className="rounded-xl border border-[var(--border)] px-8 py-3 font-mono text-sm uppercase tracking-widest text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
        >
          Host
        </Link>
      </div>
    </main>
  );
}
