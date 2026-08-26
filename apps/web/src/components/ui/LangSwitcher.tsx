"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";

const labels: Record<string, string> = {
  ru: "Рус",
  kk: "Қаз",
  en: "Eng",
};

export function LangSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-line bg-card/60 p-1 ${className}`}
      role="group"
      aria-label="Language"
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => router.replace(pathname, { locale: l })}
          className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-colors cursor-pointer ${
            l === locale
              ? "bg-white text-ink-900"
              : "text-muted hover:text-white"
          }`}
        >
          {labels[l]}
        </button>
      ))}
    </div>
  );
}
