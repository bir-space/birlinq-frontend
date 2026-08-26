"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner, PageSpinner } from "@/components/ui/Spinner";
import { AuthShell } from "@/components/auth/AuthShell";
import { LIMITS } from "@/lib/api/limits";
import { useApi, useHref } from "@/lib/app-env";

/**
 * "form" is the resting state, not an error: the verification email carries a
 * 64-hex token to paste, not a link (SendEmailVerificationAction), so arriving
 * here without `?token=` is the normal path. `?token=` is still honoured and
 * verifies on mount, in case a deep link is added later.
 */
type VerifyState = "form" | "pending" | "ok" | "error";

function VerifyEmailInner() {
  const t = useTranslations("auth");
  const api = useApi();
  const href = useHref();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const [token, setToken] = useState(tokenFromUrl ?? "");
  const [state, setState] = useState<VerifyState>(
    tokenFromUrl ? "pending" : "form"
  );
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!tokenFromUrl || started.current) return;
    started.current = true;
    api.auth
      .verifyEmail(tokenFromUrl)
      .then(() => setState("ok"))
      .catch(() => setState("error"));
  }, [tokenFromUrl, api]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) {
      setError(t("errors.required"));
      return;
    }
    setError(null);
    setState("pending");
    try {
      await api.auth.verifyEmail(trimmed);
      setState("ok");
    } catch {
      // Unknown, already used and expired all answer the same 400 by design,
      // so there is nothing more specific to tell the user.
      setError(t("errors.tokenInvalid"));
      setState("form");
    }
  }

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
          href={href("/dashboard")}
          className="mt-8 inline-flex h-[50px] w-full items-center justify-center rounded-(--radius-btn) bg-white px-6 text-[15px] font-semibold text-ink-900 transition-colors hover:bg-slate-100"
        >
          {t("verify.toDashboard")}
        </Link>
      </div>
    );
  }

  // A token that came from the URL and failed has nothing to retype, so that
  // case keeps the old dead-end screen rather than offering an empty field.
  if (state === "error") {
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
        <p className="mt-2 text-sm text-muted">{t("errors.tokenInvalid")}</p>
        <button
          type="button"
          onClick={() => {
            setToken("");
            setError(null);
            setState("form");
          }}
          className="mt-6 cursor-pointer text-sm font-semibold text-white underline-offset-4 hover:underline"
        >
          {t("verify.enterManually")}
        </button>
        <Link
          href={href("/login")}
          className="mt-6 inline-flex h-[50px] w-full items-center justify-center rounded-(--radius-btn) bg-white px-6 text-[15px] font-semibold text-ink-900 transition-colors hover:bg-slate-100"
        >
          {t("verify.toLogin")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold">{t("verify.formTitle")}</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        {t("verify.formSubtitle")}
      </p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4" noValidate>
        <Input
          label={t("fields.verifyToken")}
          hint={t("fields.verifyTokenHint")}
          placeholder={t("fields.resetTokenPlaceholder")}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          error={error}
          autoComplete="one-time-code"
          spellCheck={false}
          maxLength={LIMITS.token}
          className="font-mono text-[13px]"
        />

        <Button type="submit" className="mt-1 w-full">
          {t("verify.submit")}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm">
        <Link
          href={href("/dashboard")}
          className="text-muted underline-offset-4 hover:text-white hover:underline"
        >
          {t("verify.skip")}
        </Link>
      </p>
    </>
  );
}

export function VerifyEmailView() {
  return (
    <AuthShell>
      <Suspense fallback={<PageSpinner />}>
        <VerifyEmailInner />
      </Suspense>
    </AuthShell>
  );
}
