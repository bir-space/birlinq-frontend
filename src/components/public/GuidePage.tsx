import type { ReactNode, SVGProps } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";
import { LangSwitcher } from "@/components/ui/LangSwitcher";
import { Card } from "@/components/ui/Card";
import { IconArrowLeft, IconMapPin, IconDroplet, IconClock } from "./icons";

const ACTIVATE_STEPS = ["s1", "s2", "s3", "s4", "s5"] as const;

const ACTIVATE_ICONS: Record<(typeof ACTIVATE_STEPS)[number], ReactNode> = {
  s1: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 14h3m4 0h0M14 21h3m-3-3.5h7" />
    </svg>
  ),
  s2: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </svg>
  ),
  s3: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.4 10l-2-4A2 2 0 0 0 14.6 5H9.4a2 2 0 0 0-1.8 1.1l-2 4-2.1 1.1C2.7 12.3 2 13.1 2 14v2c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  ),
  s4: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 13c0 5-3.5 7.5-7.7 9a.6.6 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .7-1c3-.9 5-1.9 6.7-2.9a1.2 1.2 0 0 1 1.2 0c1.7 1 3.7 2 6.7 2.9A1 1 0 0 1 20 6z" />
    </svg>
  ),
  s5: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
};

const PLACE_CARDS = [
  { key: "where", icon: IconMapPin, tone: "text-accent bg-accent/15" },
  { key: "prep", icon: IconDroplet, tone: "text-accent bg-accent/15" },
  { key: "wait", icon: IconClock, tone: "text-warn bg-warn/15" },
] as const;

const FAQ_ITEMS = ["q1", "q2", "q3", "q4"] as const;

/** Public, unauthenticated instructions page: how to activate a birlinq
 * sticker and place it on the windshield. Linked from the activation entry
 * screen for owners scanning a fresh, unactivated sticker. */
export function GuidePage() {
  const t = useTranslations("guide");
  const tc = useTranslations("common");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-5">
      <header className="mb-2 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-white"
        >
          <IconArrowLeft className="size-4" />
          {tc("backHome")}
        </Link>
        <LangSwitcher />
      </header>

      <main className="flex-1">
        <div className="mt-6 flex flex-col items-center text-center">
          <Logo size="lg" />
          <p className="mt-5 text-[13px] font-semibold uppercase tracking-wide text-accent">
            {t("hero.eyebrow")}
          </p>
          <h1 className="mt-2 text-[26px] font-bold leading-tight">
            {t("hero.title")}
          </h1>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            {t("hero.lead")}
          </p>
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-bold">{t("activate.heading")}</h2>
          <p className="mt-1 text-sm text-muted">{t("activate.lead")}</p>

          <ol className="mt-6 flex flex-col gap-5">
            {ACTIVATE_STEPS.map((s, i) => (
              <li key={s} className="flex items-start gap-4">
                <span className="relative grid size-10 shrink-0 place-items-center rounded-full border border-card-border bg-card text-accent">
                  {ACTIVATE_ICONS[s]}
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-brand-gradient text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </span>
                <div className="pt-1">
                  <p className="text-[15px] font-semibold text-white">
                    {t(`activate.${s}Title`)}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">
                    {t(`activate.${s}Text`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold">{t("place.heading")}</h2>
          <p className="mt-1 text-sm text-muted">{t("place.lead")}</p>

          <div className="mt-6 flex flex-col gap-3">
            {PLACE_CARDS.map(({ key, icon: Icon, tone }) => (
              <Card key={key}>
                <div className="flex items-start gap-4">
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tone}`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="text-[13px] leading-snug">
                    <p className="font-semibold text-white">
                      {t(`place.${key}Title`)}
                    </p>
                    <p className="mt-1 text-muted">{t(`place.${key}Text`)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-(--radius-card) border border-card-border bg-card p-5">
          <h2 className="text-[15px] font-semibold text-white">
            {t("check.heading")}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            {t("check.text")}
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold">{t("faq.heading")}</h2>
          <div className="mt-4 flex flex-col divide-y divide-line/40 border-t border-line/40">
            {FAQ_ITEMS.map((q) => (
              <div key={q} className="py-4">
                <p className="text-[14px] font-semibold text-white">
                  {t(`faq.${q}`)}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                  {t(`faq.a${q.slice(1)}`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/activate"
            className="inline-flex h-[50px] w-full items-center justify-center rounded-(--radius-btn) bg-white px-6 text-[15px] font-semibold text-ink-900 transition-colors hover:bg-slate-100"
          >
            {t("cta.activate")}
          </Link>
          <Link
            href="/login"
            className="inline-flex h-[50px] w-full items-center justify-center rounded-(--radius-btn) border border-card-border bg-card px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#16233d]"
          >
            {t("cta.login")}
          </Link>
        </div>
      </main>
    </div>
  );
}
