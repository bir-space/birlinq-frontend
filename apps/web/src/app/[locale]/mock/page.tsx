import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";
import { LangSwitcher } from "@/components/ui/LangSwitcher";
import { Card } from "@/components/ui/Card";
import { IconChevronRight } from "@/components/dashboard/bits";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "mock.index" });
  return { title: t("title") };
}

export default async function MockIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("mock.index");

  const sections: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: t("sections.dashboard"),
      links: [
        { href: "/mock/dashboard", label: t("links.dashboardOverview") },
        { href: "/mock/dashboard/qr", label: t("links.dashboardQr") },
        {
          href: "/mock/dashboard/qr/qr-1",
          label: t("links.dashboardQrDetail"),
        },
        {
          href: "/mock/dashboard/interactions",
          label: t("links.dashboardInteractions"),
        },
      ],
    },
    {
      title: t("sections.activation"),
      links: [{ href: "/mock/activate", label: t("links.activate") }],
    },
    {
      title: t("sections.public"),
      links: [
        { href: "/mock/q/AB12CD34", label: t("links.publicScan") },
      ],
    },
    {
      title: t("sections.auth"),
      links: [
        { href: "/mock/login", label: t("links.login") },
        { href: "/mock/register", label: t("links.register") },
        { href: "/mock/forgot-password", label: t("links.forgotPassword") },
        { href: "/mock/reset-password", label: t("links.resetPassword") },
        { href: "/mock/verify-email", label: t("links.verifyEmail") },
      ],
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-4">
        <Logo />
        <LangSwitcher />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16 pt-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1.5 text-sm text-muted">{t("subtitle")}</p>

        <div className="mt-8 flex flex-col gap-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-muted-2">
                {section.title}
              </h2>
              <Card className="flex flex-col !p-0">
                {section.links.map((link, i) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center justify-between gap-3 px-5 py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-[#16233d] ${
                      i > 0 ? "border-t border-card-border" : ""
                    }`}
                  >
                    {link.label}
                    <IconChevronRight className="size-4 shrink-0 text-muted-2" />
                  </Link>
                ))}
              </Card>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
