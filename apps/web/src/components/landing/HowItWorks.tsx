import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

const STEPS = ["s1", "s2", "s3", "s4", "s5"] as const;

const ICONS: Record<(typeof STEPS)[number], ReactNode> = {
  // qr scan
  s1: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 14h3m4 0h0M14 21h3m-3-3.5h7" />
    </svg>
  ),
  // message
  s2: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 5h16v11H8l-4 4V5Z" />
    </svg>
  ),
  // bell
  s3: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  ),
  // reply
  s4: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 10 4 14l5 4" />
      <path d="M4 14h9a7 7 0 0 0 7-7V6" />
    </svg>
  ),
  // handshake / done
  s5: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12.5 8 9l3 2.2c.9.6 2.1.5 2.8-.3l3-3.2L21 11" />
      <path d="m6 14 3.5 3.5a2 2 0 0 0 2.9-.1L15 14" />
    </svg>
  ),
};

export function HowItWorks() {
  const t = useTranslations("landing.how");

  return (
    <section id="how" className="scroll-mt-24 py-6 md:py-10">
      <div className="mx-auto w-full max-w-[1200px] px-5 md:px-10">
        <h2 className="text-[28px] font-bold tracking-tight sm:text-[32px]">
          {t("heading")}
        </h2>
        <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-muted">
          {t("lead")}
        </p>

        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {STEPS.map((s, i) => (
            <li key={s} className="relative flex flex-col items-start gap-3">
              {/* connector line to next step, desktop only */}
              {i < STEPS.length - 1 && (
                <span
                  className="absolute right-[-18px] top-6 hidden h-px w-9 bg-gradient-to-r from-line to-transparent lg:block"
                  aria-hidden
                />
              )}
              <span
                className="relative grid size-12 shrink-0 place-items-center rounded-full border border-card-border bg-card text-accent"
                aria-hidden
              >
                {ICONS[s]}
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-brand-gradient text-[10px] font-bold text-white">
                  {i + 1}
                </span>
              </span>
              <div>
                <p className="text-[15px] font-bold text-white">{t(`${s}Title`)}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  {t(`${s}Text`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
