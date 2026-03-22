"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "bg-[var(--accent-primary)] text-[var(--bg-base)] hover:opacity-90 shadow-glow",
  ghost:
    "border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-card)]",
  warm: "bg-[var(--accent-warm)] text-[var(--bg-base)] hover:opacity-90",
} as const;

type Variant = keyof typeof variants;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 font-body text-sm font-medium transition ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
