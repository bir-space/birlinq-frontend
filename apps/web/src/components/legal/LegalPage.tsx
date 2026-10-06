import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";
import { LangSwitcher } from "@/components/ui/LangSwitcher";
import { IconArrowLeft } from "@/components/public/icons";
import privacy from "@/content/legal/privacy.ru.json";
import terms from "@/content/legal/terms.ru.json";
import offer from "@/content/legal/offer.ru.json";
import consent from "@/content/legal/consent.ru.json";

/** The four documents; each is also its route (`/privacy` …) and its key under `legal.docs`. */
export const LEGAL_DOCS = ["privacy", "terms", "offer", "consent"] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];

interface LegalSection {
  /** Empty for a preamble or a closing note — rendered without a heading. */
  heading: string;
  paragraphs: string[];
}

interface LegalContent {
  title: string;
  /** ISO date of the last revision. */
  updated: string;
  sections: LegalSection[];
}

const CONTENT: Record<LegalDoc, LegalContent> = {
  privacy,
  terms,
  offer,
  consent,
};

/**
 * The documents exist in Russian only, and the Russian text is the binding
 * one (FE-013): the bodies live in `content/legal/*.ru.json` on the server,
 * never in the i18n bundle, and the KK/EN pages get the same body marked
 * `lang="ru"` under a translated frame and a notice saying so.
 */
const CONTENT_LANG = "ru";

/** `YYYY-MM-DD` → a UTC-midnight instant, so no server timezone can shift the day. */
function isoDate(ymd: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * One legal document in the guide's frame: back link and language pills
 * on top, the logo, the title with its revision date, the binding-version
 * notice, the body, and the way to the other three documents.
 */
export async function LegalPage({
  doc,
  locale,
}: {
  doc: LegalDoc;
  locale: string;
}) {
  const t = await getTranslations("legal");
  const format = await getFormatter();
  const content = CONTENT[doc];
  const bodyLang = locale === CONTENT_LANG ? undefined : CONTENT_LANG;
  const others = LEGAL_DOCS.filter((other) => other !== doc);
  const updated = format.dateTime(isoDate(content.updated), {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-12 pt-5">
      <header className="mb-2 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-white"
        >
          <IconArrowLeft className="size-4" />
          {t("backHome")}
        </Link>
        <LangSwitcher />
      </header>

      <main className="flex-1">
        <div className="mt-6">
          <Logo />
        </div>

        <h1
          lang={bodyLang}
          className="mt-6 text-[26px] font-bold leading-tight tracking-tight"
        >
          {content.title}
        </h1>
        <p className="mt-2 text-[13px] text-muted-2">
          {t("updated", { date: updated })}
        </p>
        <p className="mt-5 rounded-(--radius-btn) border border-card-border bg-card px-4 py-3 text-[13px] text-muted">
          {t("notice")}
        </p>

        <article lang={bodyLang} className="mt-8 flex flex-col gap-7">
          {content.sections.map((section, i) => (
            <section key={i} className="flex flex-col gap-3">
              {section.heading && (
                <h2 className="text-[17px] font-bold">{section.heading}</h2>
              )}
              {section.paragraphs.map((paragraph, j) => (
                <p key={j} className="text-[15px] leading-relaxed text-muted">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </article>

        <nav
          aria-label={t("allDocs")}
          className="mt-12 border-t border-line/40 pt-6"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-2">
            {t("allDocs")}
          </p>
          <ul className="mt-3 flex flex-col gap-2.5">
            {others.map((other) => (
              <li key={other}>
                <Link
                  href={`/${other}`}
                  className="text-[14px] font-medium text-accent transition-colors hover:text-white"
                >
                  {t(`docs.${other}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </div>
  );
}
