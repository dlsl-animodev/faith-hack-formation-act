"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/Card";

interface QRDisplayProps {
  joinUrl: string;
  participantCount: number;
}

export function QRDisplay({ joinUrl, participantCount }: QRDisplayProps) {
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

      <div className="rounded-3xl bg-white p-6 shadow-glow">
        <QRCodeSVG
          value={joinUrl}
          size={320}
          level="H"
          fgColor="#7c6af7"
          bgColor="#ffffff"
          includeMargin
        />
      </div>

      <div className="max-w-xl space-y-2 px-4">
        <p className="font-mono text-xs text-[var(--text-muted)]">manual_url</p>
        <p className="break-all font-mono text-sm text-[var(--accent-success)]">{joinUrl}</p>
      </div>
    </Card>
  );
}
