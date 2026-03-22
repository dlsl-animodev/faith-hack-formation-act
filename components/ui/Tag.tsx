interface TagProps {
  label: string;
  color?: string;
}

export function Tag({ label, color }: TagProps) {
  return (
    <span
      className="inline-flex items-center rounded-full border border-[var(--border)] px-3 py-1 font-mono text-xs uppercase tracking-wide text-[var(--text-secondary)]"
      style={
        color
          ? {
              borderColor: color,
              color,
              boxShadow: `0 0 12px ${color}33`,
            }
          : undefined
      }
    >
      {label}
    </span>
  );
}
