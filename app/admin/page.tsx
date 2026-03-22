"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPanel } from "@/components/admin/AdminPanel";

export default function AdminPage() {
  const router = useRouter();
  const [secret, setSecret] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = sessionStorage.getItem("fh_admin_secret");
    if (!s) {
      router.replace("/admin/login");
      return;
    }
    setSecret(s);
  }, [router]);

  if (!secret) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] font-mono text-sm text-[var(--text-muted)]">
        verifying_gate
        <span className="ml-1 animate-cursor text-[var(--accent-primary)]">▍</span>
      </div>
    );
  }

  return <AdminPanel adminSecret={secret} />;
}
