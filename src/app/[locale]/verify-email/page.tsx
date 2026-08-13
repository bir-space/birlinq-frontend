"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Spinner, PageSpinner } from "@/components/ui/Spinner";
import { AuthShell } from "@/components/auth/AuthShell";
import { unimplementedAuthApi } from "@/lib/api/endpoints";

type VerifyState = "pending" | "ok" | "error";

function VerifyEmailInner() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<VerifyState>(token ? "pending" : "error");
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    unimplementedAuthApi
      .verifyEmail(token)
      .then(() => setState("ok"))
      .catch(() => setState("error"));
  }, [token]);

  if (state === "pending") {
    return (
      <div className="flex flex-col items-center gap-4 pt-16 text-center">
        <Spinner className="size-8" />
        <p className="text-sm text-muted">{t("verify.verifying")}</p>
      </div>
    );
  }

  if (state === "ok") {
    return (
      <div className="flex flex-col items-center pt-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h1 className="mt-5 text-2xl font-bold">{t("verify.successTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("verify.successText")}</p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex h-[50px] w-full items-center justify-center rounded-(--radius-btn) bg-white px-6 text-[15px] font-semibold text-ink-900 transition-colors hover:bg-slate-100"
        >
          {t("verify.toDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-10 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-danger/15 text-danger">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 8v5m0 3.5v.01M12 3l9 16H3l9-16z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <h1 className="mt-5 text-2xl font-bold">{t("verify.errorTitle")}</h1>
      <p className="mt-2 text-sm text-muted">
        {token ? t("errors.tokenInvalid") : t("errors.tokenMissing")}
      </p>
      <Link
        href="/login"
        className="mt-8 inline-flex h-[50px] w-full items-center justify-center rounded-(--radius-btn) bg-white px-6 text-[15px] font-semibold text-ink-900 transition-colors hover:bg-slate-100"
      >
        {t("verify.toLogin")}
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <Suspense fallback={<PageSpinner />}>
        <VerifyEmailInner />
      </Suspense>
    </AuthShell>
  );
}
