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
 * The dynamic import keeps a static prefix on purpose — bundlers need that to
 * build the context module over `messages/`. Interpolating the whole path
 * would leave them nothing to resolve.
 */
export async function loadMessages(
  locale: Locale
): Promise<Record<Namespace, unknown>> {
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      const mod = await import(`../messages/${locale}/${ns}.json`);
      return [ns, mod.default] as const;
    })
  );

  return Object.fromEntries(entries) as Record<Namespace, unknown>;
}
