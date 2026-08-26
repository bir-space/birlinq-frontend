"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormAlert } from "@/components/auth/FormAlert";
import { useApi, useHref } from "@/lib/app-env";
import { LIMITS } from "@/lib/api/limits";
import { ApiRequestError, ErrorCode, isValidationError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/use-auth";

type View = "form" | "notFound" | "already";

/** Decorative QR tile shown at the top of the entry screen (A1). */
function QrIllustration() {
  return (
    <div className="flex size-28 items-center justify-center rounded-(--radius-panel) bg-card text-accent">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
        <rect x="6" y="6" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="3" />
        <rect x="11" y="11" width="6" height="6" fill="currentColor" />
        <rect x="42" y="6" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="3" />
        <rect x="47" y="11" width="6" height="6" fill="currentColor" />
        <rect x="6" y="42" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="3" />
        <rect x="11" y="47" width="6" height="6" fill="currentColor" />
        <rect x="30" y="30" width="5" height="5" fill="currentColor" />
        <rect x="38" y="34" width="5" height="5" fill="currentColor" />
        <rect x="46" y="42" width="5" height="5" fill="currentColor" />
        <rect x="34" y="44" width="5" height="5" fill="currentColor" />
        <rect x="44" y="30" width="5" height="5" fill="currentColor" />
        <rect x="52" y="50" width="5" height="5" fill="currentColor" />
      </svg>
    </div>
  );
}

/** Read-only segmented display of the sticker code from the QR link (A1 boxes). */
function CodeBoxes({ code }: { code: string }) {
  const chars = code.toUpperCase().split("");
  const mid = Math.ceil(chars.length / 2);
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {chars.map((ch, i) => (
        <span key={i} className="contents">
          {i === mid && (
            <span className="h-px w-3 shrink-0 bg-line" aria-hidden />
          )}
          <span
            className={`flex h-12 w-10 items-center justify-center rounded-xl border bg-card text-[20px] font-bold ${
              i === 0 ? "border-accent" : "border-card-border"
            }`}
          >
            {ch}
          </span>
        </span>
      ))}
    </div>
  );
}

export function EntryStep({
  initialCode,
  initialToken,
  loginNextHref,
  onVerified,
}: {
  initialCode: string;
  initialToken: string;
  /** href of the standalone login page carrying ?next= back to this activation */
  loginNextHref: string;
  onVerified: (code: string, token: string) => void;
}) {
  const t = useTranslations("activation.entry");
  const tNotFound = useTranslations("activation.notFound");
  const tAlready = useTranslations("activation.already");
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const href = useHref();

  const fromQr = Boolean(initialCode && initialToken);
  const [manual, setManual] = useState(!fromQr);
  const [code, setCode] = useState(initialCode);
  const [token, setToken] = useState(initialToken);
  const [view, setView] = useState<View>("form");
  const [checking, setChecking] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedToken = token.trim();
    // The backend rejects anything under 6 characters with a 422, and
    // /qr/lookup is throttled to 30/min per IP - catching it here keeps a
    // half-typed code from spending one of those attempts.
    const codeProblem = !trimmedCode
      ? t("codeRequired")
      : trimmedCode.length < LIMITS.qrCodeMin
        ? t("codeTooShort", { min: LIMITS.qrCodeMin })
        : null;
    setCodeError(codeProblem);
    setTokenError(!trimmedToken ? t("tokenRequired") : null);
    setFormError(null);
    if (codeProblem || !trimmedToken) return;

    setChecking(true);
    try {
      const { qr_code } = await api.qr.lookup({
        code: trimmedCode,
        activation_token: trimmedToken,
      });
      if (qr_code.status === "activated") {
        setView("already");
      } else {
        onVerified(trimmedCode, trimmedToken);
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.code === ErrorCode.QrNotFound || err.status === 404) {
          setView("notFound");
        } else if (
          err.code === ErrorCode.QrAlreadyActivated ||
          err.status === 409
        ) {
          setView("already");
        } else if (isValidationError(err)) {
          setFormError(t("genericError"));
          setManual(true);
        } else {
          setFormError(err.message || t("genericError"));
        }
      } else {
        setFormError(t("genericError"));
      }
    } finally {
      setChecking(false);
    }
  }

  if (view === "notFound") {
    return (
      <div className="flex flex-col items-center pt-12 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-danger/15 text-danger">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M16.5 16.5L21 21M8.5 11h5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <h1 className="mt-5 text-2xl font-bold">{tNotFound("title")}</h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
          {tNotFound("text")}
        </p>
        <Button
          className="mt-8 w-full"
          onClick={() => {
            setView("form");
            setManual(true);
            setFormError(null);
          }}
        >
          {tNotFound("retry")}
        </Button>
      </div>
    );
  }

  if (view === "already") {
    return (
      <div className="flex flex-col items-center pt-12 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-warn/15 text-warn">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M8 10V7a4 4 0 018 0v3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <h1 className="mt-5 text-2xl font-bold">{tAlready("title")}</h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
          {tAlready("text")}
        </p>
        {isAuthenticated ? (
          <Link
            href={href("/dashboard")}
            className="mt-8 inline-flex h-[50px] w-full items-center justify-center rounded-(--radius-btn) bg-white px-6 text-[15px] font-semibold text-ink-900 transition-colors hover:bg-slate-100"
          >
            {tAlready("dashboard")}
          </Link>
        ) : (
          <Link
            href={loginNextHref}
            className="mt-8 inline-flex h-[50px] w-full items-center justify-center rounded-(--radius-btn) bg-white px-6 text-[15px] font-semibold text-ink-900 transition-colors hover:bg-slate-100"
          >
            {tAlready("login")}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-4">
      <QrIllustration />

      <h1 className="mt-7 text-center text-[24px] font-bold">{t("title")}</h1>
      <p className="mt-2 max-w-xs text-center text-sm leading-relaxed text-muted">
        {t("subtitle")}
      </p>

      <form onSubmit={handleSubmit} className="mt-7 w-full" noValidate>
        {!manual ? (
          <>
            <CodeBoxes code={code} />
            <button
              type="button"
              onClick={() => setManual(true)}
              className="mx-auto mt-4 block cursor-pointer text-[13px] text-muted underline-offset-4 hover:text-white hover:underline"
            >
              {t("manualEntry")}
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-4">
            <Input
              label={t("codeLabel")}
              placeholder={t("codePlaceholder")}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              error={codeError}
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={LIMITS.qrCodeMax}
              className="text-center font-bold uppercase tracking-[0.3em]"
            />
            <Input
              label={t("tokenLabel")}
              placeholder="XXXX-XXXX"
              hint={t("tokenHint")}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              error={tokenError}
              autoComplete="off"
              maxLength={LIMITS.activationToken}
            />
          </div>
        )}

        {formError && (
          <div className="mt-4">
            <FormAlert>{formError}</FormAlert>
          </div>
        )}

        <Button type="submit" loading={checking} className="mt-6 w-full">
          {t("submit")}
        </Button>
      </form>

      <p className="mt-6 text-[13px] text-muted-2">{t("or")}</p>
      <p className="mt-3 max-w-xs text-center text-[13px] leading-snug text-muted">
        {t("scanHint")}
      </p>

      <Link
        href={href("/")}
        className="mt-8 text-[13px] text-muted underline-offset-4 hover:text-white hover:underline"
      >
        {t("whatIs")}
      </Link>
      <Link
        href="/guide"
        className="mt-2 text-[13px] text-muted underline-offset-4 hover:text-white hover:underline"
      >
        {t("guideLink")}
      </Link>

      <div className="mt-10 flex w-full items-start gap-3 rounded-(--radius-card) border border-card-border bg-card p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-ink-900">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 3l7 3v5c0 4.5-3 8.4-7 10-4-1.6-7-5.5-7-10V6l7-3z"
              fill="currentColor"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="#07101d"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className="text-[12px] leading-snug">
          <p className="font-semibold text-white">{t("bannerTitle")}</p>
          <p className="mt-0.5 text-muted">{t("bannerText")}</p>
        </div>
      </div>
    </div>
  );
}
