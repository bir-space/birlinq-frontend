"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@birlinq/core";
import { useHref, usePlatform } from "@birlinq/platform";
import { Logo } from "@/components/ui/Logo";
import { LangSwitcher } from "@/components/ui/LangSwitcher";
import { PageSpinner } from "@/components/ui/Spinner";
import { IconLogout, IconUser } from "./bits";
import { ProductSwitcher } from "./ProductSwitcher";
import {
  PRODUCT_HOME,
  PROFILE_PATH,
  TABS,
  productFromPath,
  readRememberedProduct,
  rememberProduct,
  type Product,
} from "./products";

/** The pathname without the platform's base path — what `productFromPath` reads. */
function stripBasePath(pathname: string, basePath: string): string {
  if (basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))) {
    return pathname.slice(basePath.length) || "/";
  }
  return pathname;
}

/**
 * Shared shell for all /dashboard pages: auth guard, top bar with logo,
 * the Move ⇄ Business switcher, the active product's tabs, a neutral
 * profile pill, user name + logout and language switcher. Bar and content
 * share one max-w-[1200px] track — the same one the landing header uses, so
 * the logo never shifts between the two and content lines up under it
 * (sidebar-less top-nav layout on desktop).
 *
 * Which product is showing comes off the pathname (FE-011). The profile page
 * belongs to neither, so there — and for the logo's target — the last
 * product seen is used, remembered in localStorage. That memory only ever
 * decides a highlight and a link; it never redirects anyone.
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
  const { basePath, isMock } = usePlatform();
  const [loggingOut, setLoggingOut] = useState(false);
  const [remembered, setRemembered] = useState<Product | null>(null);

  const rel = stripBasePath(pathname, basePath);
  const fromPath = productFromPath(rel);
  const product: Product = fromPath ?? remembered ?? "move";

  // Read the memory after mount only: the server has no localStorage, and a
  // highlight that differed between the two renders would be a hydration error.
  useEffect(() => {
    setRemembered(readRememberedProduct());
  }, []);

  useEffect(() => {
    if (fromPath) {
      rememberProduct(fromPath);
      setRemembered(fromPath);
    }
  }, [fromPath]);

  /**
   * The guard. Arriving signed out gets `/login?next=<here>` so the login
   * page can bring the owner back to the deep link they opened. A session
   * that dies later (the refresh token revoked elsewhere) goes to a plain
   * `/login` — the page they were on is not somewhere to return to. The
   * shell's own logout navigates itself, so the guard stays out of its way.
   */
  const wasAuthenticated = useRef(false);
  if (isAuthenticated) wasAuthenticated.current = true;

  useEffect(() => {
    if (loading || isAuthenticated || loggingOut) return;
    if (wasAuthenticated.current) {
      router.replace(href("/login"));
      return;
    }
    router.replace(href(`/login?next=${encodeURIComponent(pathname)}`));
  }, [loading, isAuthenticated, loggingOut, router, href, pathname]);

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

  const tabCls = (active: boolean) =>
    `whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
      active
        ? "bg-white text-ink-900"
        : "text-muted hover:bg-card hover:text-white"
    }`;

  const profileTarget = href(PROFILE_PATH);
  const profileActive =
    pathname === profileTarget || pathname.startsWith(`${profileTarget}/`);

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
          <Logo href={href(PRODUCT_HOME[product])} className="h-[72px]" />

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

          {/* One strip: switcher · divider · the product's tabs … profile.
              It scrolls sideways on phones rather than wrapping, so the
              profile pill is always reachable at the end of the row. */}
          <nav
            aria-label={tc("dashboard")}
            className="-mx-5 order-last flex w-[calc(100%+2.5rem)] items-center gap-1 overflow-x-auto px-5 pb-3 md:-mx-10 md:w-[calc(100%+5rem)] md:px-10 lg:mx-0 lg:order-none lg:ml-6 lg:w-auto lg:flex-1 lg:px-0 lg:pb-0"
          >
            <ProductSwitcher value={product} className="mr-1" />
            <span
              aria-hidden="true"
              className="mx-1 h-5 w-px shrink-0 self-center bg-line"
            />
            {TABS[product].map((tab) => {
              const target = href(tab.href);
              const active = tab.exact
                ? pathname === target
                : pathname.startsWith(target);
              return (
                <Link
                  key={tab.href}
                  href={target}
                  aria-current={active ? "page" : undefined}
                  className={tabCls(active)}
                >
                  {t(`nav.${tab.key}`)}
                </Link>
              );
            })}
            <Link
              href={profileTarget}
              aria-current={profileActive ? "page" : undefined}
              className={`ml-auto inline-flex items-center gap-1.5 ${tabCls(profileActive)}`}
            >
              <IconUser className="size-4" />
              {t("nav.profile")}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-6 sm:py-8 md:px-10">
        {children}
      </main>
    </div>
  );
}
