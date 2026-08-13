"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Sticky strip shown on every /mock page so it's never mistaken for real data. */
export function MockBanner() {
  const t = useTranslations("mock");
  return (
    <div className="sticky top-0 z-40 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 border-b border-warn/30 bg-warn/15 px-4 py-1.5 text-center text-[12px] font-semibold text-warn">
      <span>{t("banner")}</span>
      <Link
        href="/mock"
        className="underline underline-offset-2 hover:text-white"
      >
        {t("bannerBack")}
      </Link>
    </div>
  );
}
