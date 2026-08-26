import { useTranslations } from "next-intl";

/** Partner wordmarks from the Figma frame — brand names, not translated. */
const PARTNERS = [
  "TECH GARDEN",
  "MOST Ventures",
  "astana hub",
  "Halyk",
  "Kaspi.kz",
  "FREEDOM",
] as const;

export function TrustStrip() {
  const t = useTranslations("landing.trust");

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-5 md:px-10 lg:flex-row lg:items-center lg:gap-12">
        <p className="shrink-0 text-[13px] font-semibold tracking-wide text-muted-2 uppercase">
          {t("heading")}
        </p>
        <ul className="flex flex-1 flex-wrap items-center gap-x-10 gap-y-4 lg:justify-between">
          {PARTNERS.map((name) => (
            <li
              key={name}
              className="text-[17px] font-extrabold tracking-wide text-muted-2/80 transition-colors hover:text-muted"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
