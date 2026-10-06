import type { CSSProperties } from "react";
import { CARD_THEMES, type CardTheme } from "@birlinq/api";

/**
 * The ten card themes as palettes (FE-012). A theme reaches the DOM as CSS
 * custom properties on the card's `<article>` alone — `themeStyle()` — so
 * the dark app around the card never changes, and the card components use
 * `bg-(--card-surface)`, `text-(--card-text)` and friends without knowing
 * which theme is on.
 *
 * `default` is the app's own look and references the design tokens, so a
 * token change follows through. The other nine are literal hex, and this is
 * the one file where such literals are allowed: they are the product, not
 * chrome. The vertical colours (`move`/`id`/`biz`) are not used here.
 */
export interface ThemePalette {
  /** Drives `[data-scheme]` on the article: form controls and selection follow. */
  scheme: "dark" | "light";
  /** The article's own background. */
  bg: string;
  /** Tiles, pills and panels on top of `bg`. */
  surface: string;
  border: string;
  text: string;
  muted: string;
  /** Icons, links and the filled action. */
  accent: string;
  /** Text on `accent`. */
  accentFg: string;
  /** Header gradient, also the cover fallback. */
  headFrom: string;
  headTo: string;
  /** Three rotating tag tones. */
  tags: readonly [TagTone, TagTone, TagTone];
}

export interface TagTone {
  bg: string;
  fg: string;
}

const LIGHT_TEXT = "#1f2937";
const LIGHT_MUTED = "#6b7280";
const WHITE = "#ffffff";

export const THEMES: Record<CardTheme, ThemePalette> = {
  default: {
    scheme: "dark",
    bg: "var(--color-ink-soft)",
    surface: "var(--color-card)",
    border: "var(--color-card-border)",
    text: WHITE,
    muted: "var(--color-muted)",
    accent: "var(--color-brand-blue)",
    accentFg: WHITE,
    headFrom: "var(--color-brand-blue)",
    headTo: "var(--color-brand-violet)",
    tags: [
      {
        bg: "color-mix(in oklab, var(--color-brand-blue) 20%, transparent)",
        fg: "#c7d7fb",
      },
      {
        bg: "color-mix(in oklab, var(--color-brand-violet) 20%, transparent)",
        fg: "#dccdfc",
      },
      {
        bg: "color-mix(in oklab, var(--color-brand-ice) 12%, transparent)",
        fg: "var(--color-brand-ice)",
      },
    ],
  },
  premium: {
    scheme: "dark",
    bg: "#0b0b0d",
    surface: "#18181b",
    border: "#3d3418",
    text: "#f5f5f4",
    muted: "#a8a29e",
    accent: "#eab308",
    accentFg: "#111111",
    headFrom: "#ca8a04",
    headTo: "#facc15",
    tags: [
      { bg: "#3a2e0c", fg: "#fcd34d" },
      { bg: "#3b3210", fg: "#fde047" },
      { bg: "#33290b", fg: "#fde68a" },
    ],
  },
  minimal: {
    scheme: "light",
    bg: WHITE,
    surface: "#f3f4f6",
    border: "#d1d5db",
    text: "#111111",
    muted: LIGHT_MUTED,
    accent: "#111111",
    accentFg: WHITE,
    headFrom: "#000000",
    headTo: "#3f3f46",
    tags: [
      { bg: "#e5e7eb", fg: "#111827" },
      { bg: "#d1d5db", fg: "#111827" },
      { bg: "#f3f4f6", fg: "#1f2937" },
    ],
  },
  vibrant: {
    scheme: "light",
    bg: "#faf5ff",
    surface: WHITE,
    border: "#e9d5ff",
    text: LIGHT_TEXT,
    muted: LIGHT_MUTED,
    accent: "#9333ea",
    accentFg: WHITE,
    headFrom: "#ec4899",
    headTo: "#3b82f6",
    tags: [
      { bg: "#fbcfe8", fg: "#6b21a8" },
      { bg: "#e9d5ff", fg: "#1e40af" },
      { bg: "#fecdd3", fg: "#9f1239" },
    ],
  },
  sunset: {
    scheme: "light",
    bg: "#fff7ed",
    surface: WHITE,
    border: "#fecdd3",
    text: LIGHT_TEXT,
    muted: LIGHT_MUTED,
    accent: "#e11d48",
    accentFg: WHITE,
    headFrom: "#f97316",
    headTo: "#ec4899",
    tags: [
      { bg: "#fed7aa", fg: "#9a3412" },
      { bg: "#fecdd3", fg: "#9f1239" },
      { bg: "#fbcfe8", fg: "#9d174d" },
    ],
  },
  ocean: {
    scheme: "light",
    bg: "#f0f9ff",
    surface: WHITE,
    border: "#bae6fd",
    text: LIGHT_TEXT,
    muted: LIGHT_MUTED,
    accent: "#0284c7",
    accentFg: WHITE,
    headFrom: "#3b82f6",
    headTo: "#14b8a6",
    tags: [
      { bg: "#bfdbfe", fg: "#1e40af" },
      { bg: "#a5f3fc", fg: "#155e75" },
      { bg: "#bae6fd", fg: "#075985" },
    ],
  },
  forest: {
    scheme: "light",
    bg: "#f0fdf4",
    surface: WHITE,
    border: "#a7f3d0",
    text: LIGHT_TEXT,
    muted: LIGHT_MUTED,
    accent: "#059669",
    accentFg: WHITE,
    headFrom: "#16a34a",
    headTo: "#0d9488",
    tags: [
      { bg: "#bbf7d0", fg: "#065f46" },
      { bg: "#a7f3d0", fg: "#115e59" },
      { bg: "#d9f99d", fg: "#166534" },
    ],
  },
  elegant: {
    scheme: "light",
    bg: "#f8fafc",
    surface: WHITE,
    border: "#e2e8f0",
    text: LIGHT_TEXT,
    muted: "#64748b",
    accent: "#334155",
    accentFg: WHITE,
    headFrom: "#334155",
    headTo: "#3f3f46",
    tags: [
      { bg: "#e2e8f0", fg: "#1e293b" },
      { bg: "#e5e7eb", fg: "#1f2937" },
      { bg: "#e4e4e7", fg: "#27272a" },
    ],
  },
  dark: {
    scheme: "dark",
    bg: "#0f172a",
    surface: "#1a2234",
    border: "#26365a",
    text: "#f1f5f9",
    muted: "#94a3b8",
    accent: "#60a5fa",
    accentFg: "#0f172a",
    headFrom: "#2563eb",
    headTo: "#9333ea",
    tags: [
      { bg: "#1e3a8a", fg: "#bfdbfe" },
      { bg: "#312e81", fg: "#c7d2fe" },
      { bg: "#581c87", fg: "#e9d5ff" },
    ],
  },
  rosegold: {
    scheme: "light",
    bg: "#fff1f2",
    surface: WHITE,
    border: "#fecdd3",
    text: LIGHT_TEXT,
    muted: LIGHT_MUTED,
    accent: "#e11d48",
    accentFg: WHITE,
    headFrom: "#fb7185",
    headTo: "#fbbf24",
    tags: [
      { bg: "#fecdd3", fg: "#9f1239" },
      { bg: "#fbcfe8", fg: "#9d174d" },
      { bg: "#fde68a", fg: "#92400e" },
    ],
  },
};

/** True for one of the ten ids — the guard behind `?theme=` and old payloads. */
export function isCardTheme(value: unknown): value is CardTheme {
  return (
    typeof value === "string" &&
    (CARD_THEMES as readonly string[]).includes(value)
  );
}

/** A theme id out of anything, `default` when it is not one. */
export function themeOf(value: unknown): CardTheme {
  return isCardTheme(value) ? value : "default";
}

/**
 * The palette as custom properties for the card's `<article style>`. The
 * `--card-*` names are what every component under `components/card` reads:
 * `bg-(--card-surface)`, `border-(--card-border)`, `text-(--card-muted)`…
 */
export function themeStyle(theme: CardTheme): CSSProperties {
  const p = THEMES[theme];
  const vars: Record<`--${string}`, string> = {
    "--card-bg": p.bg,
    "--card-surface": p.surface,
    "--card-border": p.border,
    "--card-text": p.text,
    "--card-muted": p.muted,
    "--card-accent": p.accent,
    "--card-accent-fg": p.accentFg,
    "--card-head-from": p.headFrom,
    "--card-head-to": p.headTo,
    "--card-tag-bg-1": p.tags[0].bg,
    "--card-tag-fg-1": p.tags[0].fg,
    "--card-tag-bg-2": p.tags[1].bg,
    "--card-tag-fg-2": p.tags[1].fg,
    "--card-tag-bg-3": p.tags[2].bg,
    "--card-tag-fg-3": p.tags[2].fg,
  };
  return vars as CSSProperties;
}

/** The header gradient as one `background-image` value — for swatches and covers. */
export function headGradient(theme: CardTheme): string {
  const p = THEMES[theme];
  return `linear-gradient(135deg, ${p.headFrom} 0%, ${p.headTo} 100%)`;
}
