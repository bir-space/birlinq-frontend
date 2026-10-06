import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";

/** The legal documents, in the order the footer lists them; each is its own route. */
const LEGAL_DOCS = ["privacy", "terms", "offer", "consent"] as const;

export function LandingFooter() {
  const t = useTranslations("landing");

  const anchors: Array<[string, string]> = [
    ["#move", t("nav.move")],
    ["#business", t("nav.business")],
    ["#id", t("nav.id")],
    ["#how", t("nav.how")],
    ["#why", t("nav.why")],
    ["#lead", t("nav.lead")],
  ];

  return (
    <footer className="border-t border-line/40">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-5 pt-12 md:px-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-[300px]">
          <Logo />
          <p className="mt-3 text-[13px] leading-relaxed text-muted-2">
            {t("footer.tagline")}
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-3">
          {anchors.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="text-[13px] font-medium text-muted transition-colors hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-5 py-8 md:px-10 lg:flex-row lg:items-center lg:justify-between">
        <nav
          aria-label={t("footer.legal.title")}
          className="flex flex-wrap gap-x-6 gap-y-2"
        >
          {LEGAL_DOCS.map((doc) => (
            <Link
              key={doc}
              href={`/${doc}`}
              className="text-[13px] text-muted-2 transition-colors hover:text-white"
            >
              {t(`footer.legal.${doc}`)}
            </Link>
          ))}
        </nav>
        <p className="text-[13px] text-muted-2">
          {t("footer.rights", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
