import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

const ICONS: Record<string, ReactNode> = {
  // bolt
  f1: (
    <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
      <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
    </svg>
  ),
  // shield-check
  f2: (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4.5" />
    </svg>
  ),
  // target
  f3: (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  ),
  // grid of apps
  f4: (
    <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="3.5" />
    </svg>
  ),
};

/** One tile carries the full brand gradient (the "signature" tile);
 *  the rest borrow the vertical palette — blue, violet, green. No red. */
const TILE_STYLE: Record<string, string> = {
  f1: "bg-brand-gradient text-white",
  f2: "border border-move/30 bg-move/10 text-move",
  f3: "border border-id/30 bg-id/10 text-id",
  f4: "border border-biz/30 bg-biz/10 text-biz",
};

export function WhyBirlinq() {
  const t = useTranslations("landing.why");
  const features = ["f1", "f2", "f3", "f4"] as const;

  return (
    <section id="why" className="scroll-mt-24 py-6 md:py-10">
      <div className="mx-auto w-full max-w-[1200px] px-5 md:px-10">
        <h2 className="text-[28px] font-bold tracking-tight sm:text-[32px]">
          {t("heading")}
        </h2>
        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f}>
              <div
                className={`grid size-12 place-items-center rounded-2xl ${TILE_STYLE[f]}`}
              >
                {ICONS[f]}
              </div>
              <h3 className="mt-4 text-[18px] font-bold">{t(`${f}Title`)}</h3>
              <p className="mt-2 max-w-[260px] text-[14px] leading-relaxed text-muted">
                {t(`${f}Text`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
