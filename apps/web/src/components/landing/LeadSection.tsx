import { useTranslations } from "next-intl";
import { GlowBlobs, PhoneMockup } from "./decor";
import { LeadForm } from "./LeadForm";

export function LeadSection() {
  const t = useTranslations("landing.leadSection");

  return (
    <section id="lead" className="scroll-mt-24 py-16 md:py-24">
      <div className="mx-auto w-full max-w-[1200px] px-5 md:px-10">
        <div className="relative overflow-hidden rounded-(--radius-panel) border border-line/40 bg-ink-soft">
          <GlowBlobs />
          <div className="relative grid gap-10 p-6 md:p-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col">
              <h2 className="max-w-[480px] text-[30px] leading-tight font-bold tracking-tight sm:text-[38px]">
                {t("heading")}
              </h2>
              <p className="mt-5 max-w-[460px] text-[15px] leading-relaxed text-muted">
                {t("text")}
              </p>
              <div className="mt-10 hidden flex-1 items-end lg:flex">
                <div className="flex items-end gap-5">
                  <PhoneMockup label="Move" vertical="move" className="h-[260px] w-[120px] -rotate-3" />
                  <PhoneMockup label="ID" vertical="id" className="h-[300px] w-[135px] rotate-2" />
                </div>
              </div>
            </div>
            <LeadForm />
          </div>
        </div>
      </div>
    </section>
  );
}
