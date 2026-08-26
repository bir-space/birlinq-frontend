import type { ReactNode } from "react";

/** Inline form-level error / info alert used across auth + activation forms. */
export function FormAlert({
  children,
  tone = "danger",
}: {
  children: ReactNode;
  tone?: "danger" | "info";
}) {
  const toneCls =
    tone === "danger"
      ? "border-danger/40 bg-danger/10 text-danger"
      : "border-card-border bg-card text-muted";
  return (
    <div
      role="alert"
      className={`rounded-(--radius-btn) border px-4 py-3 text-[13px] leading-snug ${toneCls}`}
    >
      {children}
    </div>
  );
}
