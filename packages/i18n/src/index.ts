/**
 * Locale data shared by every client.
 *
 * Only the parts that are true regardless of framework live here: which
 * locales exist, which one is the default, what the namespaces are, and how to
 * load the messages for one locale. How a locale is *chosen* is not shared —
 * the web reads it from the URL through next-intl routing, native will read it
 * from a stored preference — so that stays in each app.
 */
export const locales = ["ru", "kk", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

/** One JSON file per namespace per locale, under `messages/{locale}/`. */
export const NAMESPACES = [
  "common",
  "landing",
  "public",
  "auth",
  "activation",
  "dashboard",
  "guide",
  "mock",
] as const;

export type Namespace = (typeof NAMESPACES)[number];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/**
 * Load every namespace for one locale, keyed by namespace name.
 *
 * One static specifier per locale rather than one interpolated path: Metro
 * refuses a template-literal `import()` outright, so the interpolated version
 * bundles fine for the web and fails the moment a native build touches it. The
 * web still gets one chunk per locale out of this.
 */
export async function loadMessages(
  locale: Locale
): Promise<Record<Namespace, unknown>> {
  switch (locale) {
    case "kk":
      return (await import("./messages/kk")).default;
    case "en":
      return (await import("./messages/en")).default;
    case "ru":
      return (await import("./messages/ru")).default;
  }
}
