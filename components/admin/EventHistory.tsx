"use client";

import { useCallback, useEffect, useState } from "react";
import { EventHistoryCard } from "@/components/admin/EventHistoryCard";
import type { EventSummary } from "@/types";
import { Button } from "@/components/ui/Button";

interface EventRow {
  id: string;
  event_code: string;
  created_at: string;
  ended_at: string | null;
  summary: EventSummary | null;
}

interface EventHistoryProps {
  adminSecret: string;
}

export function EventHistory({ adminSecret }: EventHistoryProps) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<EventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/history?page=${page}&limit=10`, {
        headers: { "x-admin-secret": adminSecret },
      });
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data &&
        "success" in data &&
        (data as { success: boolean }).success &&
        "data" in data
      ) {
        const d = (data as { data: { items: EventRow[]; total: number } }).data;
        setItems(d.items);
        setTotal(d.total);
      }
    } finally {
      setLoading(false);
    }
  }, [adminSecret, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `faith-hack-history-page-${page}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!items.length && !loading) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center font-mono text-sm text-[var(--text-muted)]">
        No past events yet. Start your first Faith Hack event.
      </div>
    );
  }

  const pages = Math.max(1, Math.ceil(total / 10));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-[var(--text-muted)]">
          total records: {total}
        </p>
        <Button type="button" variant="ghost" onClick={exportJson}>
          Export page JSON
        </Button>
      </div>
      <ul className="space-y-3">
        {items.map((ev) => (
          <li key={ev.id}>
            <EventHistoryCard event={ev} />
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between font-mono text-xs text-[var(--text-secondary)]">
        <button
          type="button"
          className="rounded border border-[var(--border)] px-3 py-1 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          prev
        </button>
        <span>
          page {page} / {pages}
        </span>
        <button
          type="button"
          className="rounded border border-[var(--border)] px-3 py-1 disabled:opacity-40"
          disabled={page >= pages}
          onClick={() => setPage((p) => p + 1)}
        >
          next
        </button>
      </div>
    </div>
  );
}
