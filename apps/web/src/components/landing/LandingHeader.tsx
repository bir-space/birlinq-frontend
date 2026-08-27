"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";
import { LangSwitcher } from "@/components/ui/LangSwitcher";
import { useAuth } from "@birlinq/core";

/**
 * Landing top bar. The anchor nav is the same for everyone; the right-hand slot
 * is session-aware — a guest gets the "Войти" button, a signed-in owner gets
 * their name, which links into the cabinet. Sign-out lives in the cabinet only.
 *
 * The session lives in the browser only (see `tokenStore`), so this has to be a
 * client component: the server render is always the guest shape. While
 * `loading` is true we render a spacer instead of the guest CTA, otherwise a
 * signed-in user sees "Войти" flash before hydration settles.
 */
export function LandingHeader() {
  const t = useTranslations("landing.nav");
  const tc = useTranslations("common");
  const { user, loading, isAuthenticated } = useAuth();

  const anchors: Array<[string, string]> = [
    ["#move", t("move")],
    ["#business", t("business")],
    ["#id", t("id")],
    ["#how", t("how")],
    ["#why", t("why")],
    ["#lead", t("lead")],
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line/40 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center gap-4 px-5 md:px-10">
        <Logo />

        <nav className="ml-8 hidden items-center gap-6 lg:flex">
          {anchors.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="text-[14px] font-medium text-muted transition-colors hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <LangSwitcher className="hidden sm:inline-flex" />

          {loading ? (
            <div className="h-10 w-20" aria-hidden />
          ) : isAuthenticated ? (
            <Link
              href="/dashboard"
              title={user?.name}
              className="max-w-40 truncate text-[14px] font-semibold text-white transition-colors hover:text-muted"
            >
              {user?.name}
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-(--radius-btn) bg-white px-5 text-[14px] font-semibold text-ink-900 transition-colors hover:bg-slate-100"
            >
              {tc("login")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
