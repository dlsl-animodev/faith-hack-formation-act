"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BUG_LIST } from "@/lib/bug-list";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export interface BugSelection {
  id: string;
  label: string;
  is_custom: boolean;
}

interface PhaseBugChecklistProps {
  sessionId: string;
  initialSelected: BugSelection[];
  onSaved?: () => void;
}

export function PhaseBugChecklist({
  sessionId,
  initialSelected,
  onSaved,
}: PhaseBugChecklistProps) {
  const [custom, setCustom] = useState("");
  const [items, setItems] = useState<BugSelection[]>(() => initialSelected);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const curatedIds = useMemo(
    () => new Set<string>(BUG_LIST.map((b) => b.id)),
    []
  );

  const toggle = (id: string, label: string) => {
    setItems((prev) => {
      const exists = prev.some((p) => p.id === id);
      if (exists) {
        return prev.filter((p) => p.id !== id);
      }
      if (prev.length >= 5) return prev;
      return [...prev, { id, label, is_custom: !curatedIds.has(id) }];
    });
  };

  const addCustom = () => {
    const label = custom.trim();
    if (!label || items.length >= 5) return;
    const id = `c_${crypto.randomUUID()}`;
    setItems((prev) => [...prev, { id, label, is_custom: true }]);
    setCustom("");
  };

  const save = async () => {
    if (items.length < 1) {
      setError("Select at least one item.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          bugs: items.map((i) => ({ label: i.label, is_custom: i.is_custom })),
        }),
      });
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data &&
        "success" in data &&
        (data as { success: boolean }).success
      ) {
        onSaved?.();
      } else {
        const err =
          typeof data === "object" &&
          data &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Save failed";
        setError(err);
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="space-y-2">
        <p className="font-mono text-xs text-[var(--text-muted)]">phase_02 // private bugs</p>
        <h1 className="font-display text-3xl tracking-tight">Name the glitches</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Choose 1–5. This list stays on your device session only — never broadcast.
        </p>
      </header>

      <Card className="space-y-4">
        <ul className="space-y-2">
          {BUG_LIST.map((b) => {
            const on = items.some((i) => i.id === b.id);
            return (
              <li key={b.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-2 py-2 hover:border-[var(--border)]">
                  <input
                    type="checkbox"
                    className="mt-1 accent-[var(--accent-primary)]"
                    checked={on}
                    onChange={() => toggle(b.id, b.label)}
                  />
                  <span className="font-body text-sm text-[var(--text-primary)]">{b.label}</span>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="space-y-2 border-t border-[var(--border)] pt-4">
          <p className="font-mono text-xs text-[var(--text-muted)]">custom_entry</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Add a custom bug…"
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-body text-sm outline-none ring-[var(--accent-primary)] focus:ring-2"
            />
            <Button type="button" variant="ghost" onClick={addCustom}>
              Append
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {items.filter((i) => i.is_custom).length > 0 && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {items
                .filter((i) => i.is_custom)
                .map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between rounded-lg bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--accent-warm)]"
                  >
                    <span>{i.label}</span>
                    <button
                      type="button"
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      onClick={() => setItems((p) => p.filter((x) => x.id !== i.id))}
                    >
                      remove
                    </button>
                  </li>
                ))}
            </motion.ul>
          )}
        </AnimatePresence>

        {error && <p className="font-mono text-xs text-red-400">{error}</p>}

        <Button onClick={() => void save()} disabled={saving}>
          {saving ? "committing…" : "Save checklist"}
        </Button>
      </Card>
    </motion.div>
  );
}
