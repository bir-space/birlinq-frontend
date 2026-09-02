"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@birlinq/core";
import { useHref, usePlatform } from "@birlinq/platform";
import { Logo } from "@/components/ui/Logo";
import { LangSwitcher } from "@/components/ui/LangSwitcher";
import { PageSpinner } from "@/components/ui/Spinner";
import { IconLogout } from "./bits";

const TABS = [
  { href: "/dashboard", key: "overview", exact: true },
  { href: "/dashboard/interactions", key: "interactions", exact: false },
  { href: "/dashboard/qr", key: "qr", exact: false },
] as const;

/**
 * Shared shell for all /dashboard pages: auth guard, top bar with logo,
 * nav tabs, user name + logout and language switcher. Bar and content share
 * one max-w-[1200px] track — the same one the landing header uses, so the logo
 * never shifts between the two and content lines up under it (sidebar-less
 * top-nav layout on desktop).
 *
 * Serves both trees — the `/mock` preview supplies a mock session provider and
 * a "/mock" base path through PlatformProvider, plus its warning banner.
 */
export function DashboardShell({
  children,
  banner,
}: {
  children: ReactNode;
  /** Rendered above the header — the /mock tree passes its warning strip. */
  banner?: ReactNode;
}) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const href = useHref();
  const { isMock } = usePlatform();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace(href("/login"));
  }, [loading, isAuthenticated, router, href]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-dvh flex-col">
        {banner}
        <div className="flex flex-1 items-center justify-center">
          <PageSpinner />
        </div>
      </div>
    );
  }

  /**
   * Ends this session only — the backend carries a per-session claim in the
   * access token. Revoking every device stays available on the API
   * (POST /auth/logout-all); it is a security-settings action rather than a
   * second word in the header next to "Выйти".
   */
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace(href(isMock ? "/" : "/login"));
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {banner}
      <header
        className={`sticky z-20 border-b border-line/60 bg-ink/85 backdrop-blur ${
          banner ? "top-[29px]" : "top-0"
        }`}
      >
        {/* The logo row is locked to the landing header's 72px; on narrow
            screens the tab strip wraps under it as an extra row. */}
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center gap-x-4 px-5 md:px-10">
          <Logo href={href("/dashboard")} className="h-[72px]" />

          <div className="ml-auto flex h-[72px] items-center gap-2 lg:order-last lg:ml-0">
            <LangSwitcher />
            <span
              className="hidden max-w-36 truncate text-[13px] font-medium text-muted sm:block"
              title={user?.name}
            >
              {user?.name}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex h-[34px] cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 text-[12px] font-semibold text-muted transition-colors hover:border-card-border hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconLogout className="size-4" />
              <span className="hidden sm:inline">{tc("logout")}</span>
            </button>
          </div>

          <nav
            aria-label={tc("dashboard")}
            className="-mx-5 order-last flex w-[calc(100%+2.5rem)] gap-1 overflow-x-auto px-5 pb-3 md:-mx-10 md:w-[calc(100%+5rem)] md:px-10 lg:mx-0 lg:order-none lg:ml-6 lg:w-auto lg:flex-1 lg:px-0 lg:pb-0"
          >
            {TABS.map((tab) => {
              const target = href(tab.href);
              const active = tab.exact
                ? pathname === target
                : pathname.startsWith(target);
              return (
                <Link
                  key={tab.href}
                  href={target}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                    active
                      ? "bg-white text-ink-900"
                      : "text-muted hover:bg-card hover:text-white"
                  }`}
                >
                  {t(`nav.${tab.key}`)}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-6 sm:py-8 md:px-10">
        {children}
      </main>
    </div>
  );
}
