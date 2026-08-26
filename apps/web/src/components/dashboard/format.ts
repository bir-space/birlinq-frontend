import type { InteractionStatus, QrStatus } from "@/lib/api/types";

/** Loose translator signature so helpers can accept next-intl's `t`. */
export type TranslateFn = (
  key: string,
  values?: Record<string, string | number | Date>
) => string;

const KNOWN_SCENARIOS = new Set([
  "car_blocking",
  "window_open",
  "lights_on",
  "alarm",
  "tow",
  "accident",
  "free_message",
  "other",
]);

/**
 * Human label for a scenario code; unknown codes degrade gracefully.
 * The code is null when the event carries no scenario relation — the engine is
 * config-driven, so a scenario type can be retired while its past events stay
 * in the append-only log.
 */
export function scenarioLabel(code: string | null, t: TranslateFn): string {
  if (!code) return t("scenarios.unknown");
  if (KNOWN_SCENARIOS.has(code)) return t(`scenarios.${code}`);
  return code.replace(/_/g, " ");
}

/** "12 мин" / "2 ч" / "вчера" / date — relative timestamp for lists. */
export function formatRelativeTime(
  iso: string | null,
  t: TranslateFn,
  locale: string
): string {
  if (!iso) return t("time.never");
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return t("time.never");
  const diffMin = Math.floor((Date.now() - then) / 60_000);
  if (diffMin < 1) return t("time.justNow");
  if (diffMin < 60) return t("time.min", { n: diffMin });
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return t("time.h", { n: diffH });
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return t("time.yesterday");
  if (diffD < 30) return t("time.d", { n: diffD });
  return new Date(iso).toLocaleDateString(locale);
}

/** Local-date bucket for section headers in the interactions list. */
export function dayGroup(iso: string): "today" | "yesterday" | "earlier" {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const ts = d.getTime();
  if (ts >= startOfToday) return "today";
  if (ts >= startOfToday - 86_400_000) return "yesterday";
  return "earlier";
}

type BadgeTone = "accent" | "muted" | "warn" | "danger" | "info";

export const interactionBadgeTone: Record<InteractionStatus, BadgeTone> = {
  new: "warn",
  resolved: "accent",
  spam: "danger",
};

export function qrBadgeTone(status: QrStatus): BadgeTone {
  switch (status) {
    case "activated":
      return "accent";
    case "paused":
      return "warn";
    case "blocked":
    case "lost":
    case "deleted":
      return "danger";
    default:
      return "muted";
  }
}
