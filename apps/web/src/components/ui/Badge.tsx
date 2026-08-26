import type { ReactNode } from "react";

type Tone = "accent" | "muted" | "warn" | "danger" | "info";

const tones: Record<Tone, string> = {
  accent: "bg-accent/15 text-accent",
  muted: "bg-white/10 text-muted",
  warn: "bg-warn/15 text-warn",
  danger: "bg-danger/15 text-danger",
  info: "bg-sky-400/15 text-sky-300",
};

export function Badge({
  children,
  tone = "muted",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
