"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { IconAlertTriangle } from "@/components/public/icons";

/**
 * The locale tree's error boundary: what a visitor sees when a page throws
 * during render. It sits inside the locale layout, so the providers (and
 * the messages) are there; `reset` re-renders the segment that failed.
 */
export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-full border border-card-border bg-card text-warn">
        <IconAlertTriangle className="size-7" />
      </div>
      <h1 className="mt-5 text-xl font-bold">{t("errorTitle")}</h1>
      <p className="mt-2 max-w-xs text-sm text-muted">{t("error")}</p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <Button onClick={reset}>{t("retry")}</Button>
        <Link
          href="/"
          className="text-[13px] font-semibold text-muted underline-offset-2 transition-colors hover:text-white hover:underline"
        >
          {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
