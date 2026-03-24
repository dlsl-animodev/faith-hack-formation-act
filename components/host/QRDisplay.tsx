"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/Card";

interface QRDisplayProps {
  eventCode?: string | null;
  joinUrl: string;
  participantCount: number;
}

function codeFromJoinUrl(url: string): string | undefined {
  const parts = url.replace(/\/$/, "").split("/");
  const last = parts[parts.length - 1];
  return last && last.length > 0 ? last : undefined;
}

export function QRDisplay({ eventCode, joinUrl, participantCount }: QRDisplayProps) {
  const displayCode = eventCode ?? codeFromJoinUrl(joinUrl);
  const vercelUrl = "https://faith-hack-formation-act.vercel.app";
  const displayManualUrl = joinUrl.replace(/^http:\/\/localhost:3000|^https?:\/\/[^/]+/, vercelUrl);

  return (
    <Card className="flex min-h-[70vh] flex-col items-center justify-center gap-8 border-[var(--border)] bg-[var(--bg-base)] py-10 text-center">
      <div className="space-y-2">
        <p className="font-mono text-xs text-[var(--accent-warm)]">scan_to_join</p>
        <h1 className="font-display text-4xl text-[var(--text-primary)] md:text-5xl">Faith Hack</h1>
        <p className="font-mono text-sm text-[var(--text-secondary)]">
          {participantCount} participants joined
          <span className="ml-1 animate-cursor text-[var(--accent-primary)]">▍</span>
        </p>
      </div>

      <div className="flex w-full max-w-4xl flex-col items-center gap-10 px-4 md:flex-row md:items-start md:justify-center md:gap-12 md:text-left">
        <div className="shrink-0 rounded-3xl bg-white p-6 shadow-glow">
          <QRCodeSVG
            value={joinUrl}
            size={320}
            level="H"
            fgColor="#7c6af7"
            bgColor="#ffffff"
            includeMargin
          />
        </div>

        {displayCode ? (
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 md:pt-4">
            <p className="font-mono text-xs text-[var(--text-muted)]">event_code</p>
            <p className="font-mono text-3xl font-bold tracking-[0.2em] text-[var(--accent-primary)] md:text-4xl">
              {displayCode}
            </p>
            <p className="font-mono text-xs text-[var(--text-muted)]">Enter this code if scanning is not available.</p>
          </div>
        ) : null}
      </div>

      <div className="max-w-xl space-y-2 px-4">
        <p className="font-mono text-xs text-[var(--text-muted)]">manual_url</p>
        <p className="break-all font-mono text-sm text-[var(--accent-success)]">{displayManualUrl}</p>
      </div>
    </Card>
  );
}
