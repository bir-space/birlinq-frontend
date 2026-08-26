import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales } from "@birlinq/i18n";

/**
 * next-intl's view of the shared locale list. The list itself lives in
 * `@birlinq/i18n` because native needs it too; only URL routing is web-only.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});
