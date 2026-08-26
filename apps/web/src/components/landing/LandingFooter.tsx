import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui/Logo";

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
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-5 py-12 md:px-10 lg:flex-row lg:items-start lg:justify-between">
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
        <p className="text-[13px] text-muted-2">
          {t("footer.rights", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
