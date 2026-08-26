import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** dark (default) — #111b31 card; light — white card on light surface */
  tone?: "dark" | "light";
}

export function Card({
  children,
  tone = "dark",
  className = "",
  ...rest
}: CardProps) {
  const toneCls =
    tone === "dark"
      ? "bg-card border border-card-border text-white"
      : "bg-white border border-paper-border text-ink-900";
  return (
    <div
      className={`rounded-(--radius-card) p-5 ${toneCls} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
