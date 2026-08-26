import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

// Message namespaces, one JSON file per namespace per locale.
const NAMESPACES = [
  "common",
  "landing",
  "public",
  "auth",
  "activation",
  "dashboard",
  "guide",
  "mock",
] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      const mod = await import(`../../messages/${locale}/${ns}.json`);
      return [ns, mod.default] as const;
    })
  );

  return {
    locale,
    messages: Object.fromEntries(entries),
  };
});
