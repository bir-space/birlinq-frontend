"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/* ---------- Icons (inline SVG, stroke = currentColor) ---------- */

function iconProps(className: string) {
  return {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

export function IconChat({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.4 0-2.7-.3-3.9-.9L3 20l1-5.4A8.5 8.5 0 1 1 21 11.5Z" />
    </svg>
  );
}

export function IconQr({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 14h3v3h-3zM20 14h1M14 20h1M18 18h3v3h-3z" />
    </svg>
  );
}

export function IconCar({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M5 11 6.5 6.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
      <path d="M4 11h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1M3 12v4a1 1 0 0 0 1 1h1" />
      <circle cx="7.5" cy="16.5" r="1.8" />
      <circle cx="16.5" cy="16.5" r="1.8" />
    </svg>
  );
}

export function IconChevronRight({
  className = "size-5",
}: {
  className?: string;
}) {
  return (
    <svg {...iconProps(className)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function IconArrowLeft({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
    </svg>
  );
}

export function IconExternal({ className = "size-4" }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M14 4h6v6M20 4l-9 9M10 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}

export function IconCheck({ className = "size-4" }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function IconLogout({ className = "size-4" }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M15 8l4 4-4 4M19 12H9" />
    </svg>
  );
}

export function IconPlus({ className = "size-4" }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconUser({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6" />
    </svg>
  );
}

/** A business card: a landscape card with a portrait dot and two text lines. */
export function IconCard({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <circle cx="8.5" cy="11" r="2" />
      <path d="M13.5 10h4M13.5 13.5h4M6 16h5" />
    </svg>
  );
}

/* ---------- Small building blocks ---------- */

/** Uppercase 11px section label (as in D3 mockup). */
export function SectionLabel({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-end justify-between gap-3">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-2">
        {children}
      </span>
      {action}
    </div>
  );
}

/** Rounded icon bubble used in list rows. */
export function IconBubble({
  children,
  tone = "accent",
}: {
  children: ReactNode;
  tone?: "accent" | "muted" | "warn" | "danger";
}) {
  const tones: Record<string, string> = {
    accent: "bg-accent/15 text-accent",
    muted: "bg-white/8 text-muted",
    warn: "bg-warn/15 text-warn",
    danger: "bg-danger/15 text-danger",
  };
  return (
    <span
      className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Full-width error card with retry. */
export function ErrorCard({
  message,
  retryLabel,
  onRetry,
}: {
  message: string;
  retryLabel: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="flex flex-col items-center gap-4 py-8 text-center">
      <p className="text-[14px] text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </Card>
  );
}

/** Friendly empty state with optional CTA. */
export function EmptyState({
  icon,
  title,
  hint,
  cta,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  cta?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-white/6 text-muted">
        {icon}
      </span>
      <p className="text-[16px] font-semibold">{title}</p>
      {hint && <p className="max-w-sm text-[13px] text-muted-2">{hint}</p>}
      {cta && <div className="mt-2">{cta}</div>}
    </Card>
  );
}

/** One figure with a label — the tiles at the top of an overview. */
export function StatCard({
  label,
  value,
  sub,
  tone = "default",
  dot = false,
}: {
  label: string;
  value: number | string;
  sub?: string;
  tone?: "default" | "accent";
  /** A red dot in the corner — "needs attention". */
  dot?: boolean;
}) {
  const toneCls =
    tone === "accent"
      ? "border-accent/30 bg-accent/10"
      : "border-card-border bg-card";
  return (
    <div className={`relative rounded-(--radius-card) border p-4 ${toneCls}`}>
      {dot && (
        <span className="absolute right-3.5 top-3.5 size-2 rounded-full bg-danger" />
      )}
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-2">
        {label}
      </p>
      <p
        className={`mt-1 text-[28px] font-bold leading-none ${
          tone === "accent" ? "text-accent" : "text-white"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1.5 text-[11px] text-muted-2">{sub}</p>}
    </div>
  );
}

/** "← Back" link at the top of a detail page. `href` is already prefix-aware. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-muted transition-colors hover:text-white"
    >
      <IconArrowLeft className="size-4" />
      {label}
    </Link>
  );
}

/** Accessible switch used for privacy settings. */
export function Toggle({
  checked,
  onToggle,
  disabled = false,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        checked ? "bg-accent" : "bg-white/15"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all duration-150 ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}
