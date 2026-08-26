import { useTranslations } from "next-intl";
import { GlowBlobs, PhoneMockup } from "./decor";

const FEATURES = ["f1", "f2", "f3", "f4"] as const;

export function Hero() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative overflow-hidden bg-brand-glow">
      <GlowBlobs />
      <div className="relative mx-auto grid w-full max-w-[1200px] gap-14 px-5 py-16 md:px-10 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        {/* Copy */}
        <div>
          <h1 className="sr-only">birlinq — {t("tagline")}</h1>
          <p
            aria-hidden
            className="text-brand-gradient text-[64px] leading-none font-semibold tracking-tight sm:text-[88px]"
          >
            birlinq
          </p>
          <p className="mt-5 max-w-[560px] text-[34px] leading-[1.15] font-bold tracking-tight sm:text-[48px]">
            {t("tagline")}
          </p>
          <p className="mt-6 max-w-[520px] text-[16px] leading-relaxed text-muted">
            {t("lead")}
          </p>

          {/* Mini feature strip (from Figma hero) */}
          <div className="mt-12 grid max-w-[600px] grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f} className="border-l-2 border-accent/60 pl-3">
                <p className="text-[13px] font-semibold text-white">
                  {t(`${f}Title`)}
                </p>
                <p className="mt-1 text-[12px] leading-snug text-muted-2">
                  {t(`${f}Text`)}
                </p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-12 flex flex-wrap items-center gap-5">
            <a
              href="#lead"
              className="inline-flex h-14 items-center gap-2 rounded-(--radius-btn) bg-brand-gradient px-8 text-base font-semibold text-white shadow-[0_16px_40px_-16px_rgba(46,99,224,0.55)] transition-all hover:brightness-110"
            >
              {t("ctaPrimary")}
              <span aria-hidden>→</span>
            </a>
            <a
              href="#verticals"
              className="group inline-flex items-center gap-3 text-[14px] font-medium text-muted transition-colors hover:text-white"
            >
              <span className="grid size-14 place-items-center rounded-full border border-line transition-colors group-hover:border-accent group-hover:text-accent">
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
                  <path d="M12 16.5 5 9.5l1.4-1.4L12 13.7l5.6-5.6L19 9.5l-7 7Z" />
                </svg>
              </span>
              {t("ctaSecondary")}
            </a>
          </div>
        </div>

        {/* Phone mockups (recreated from Figma, no assets) */}
        <div className="relative hidden h-[560px] items-center justify-center lg:flex">
          <div
            className="absolute inset-0 rounded-full border border-line/30 [mask-image:linear-gradient(to_bottom,black,transparent_80%)]"
            aria-hidden
          />
          <PhoneMockup
            label="Move"
            vertical="move"
            className="absolute left-0 top-16 z-0 h-[420px] w-[180px] -rotate-6"
          />
          <PhoneMockup
            label="Business"
            vertical="biz"
            className="relative z-10 h-[500px] w-[230px]"
          />
          <PhoneMockup
            label="ID"
            vertical="id"
            className="absolute right-0 top-20 z-0 h-[400px] w-[175px] rotate-6"
          />
        </div>
      </div>
    </section>
  );
}
