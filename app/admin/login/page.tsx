"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function AdminLoginPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
        credentials: "include",
      });
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data &&
        "success" in data &&
        (data as { success: boolean }).success
      ) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("fh_admin_secret", secret);
        }
        router.replace("/admin");
        return;
      }
      const err =
        typeof data === "object" &&
        data &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Login failed";
      setError(err);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] px-4 py-16 text-[var(--text-primary)]">
      <Card className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <p className="font-mono text-xs text-[var(--text-muted)]">restricted_shell</p>
          <h1 className="font-display text-3xl">Admin access</h1>
        </div>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="ADMIN_SECRET"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-sm outline-none ring-[var(--accent-primary)] focus:ring-2"
        />
        {error && <p className="font-mono text-xs text-red-400">{error}</p>}
        <Button className="w-full" disabled={loading || !secret} onClick={() => void submit()}>
          {loading ? "authorizing…" : "Enter control room"}
        </Button>
      </Card>
    </div>
  );
}
