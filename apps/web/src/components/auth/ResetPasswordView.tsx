"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormAlert } from "@/components/auth/FormAlert";
import { PASSWORD_MIN, detailsToFieldErrors } from "@/components/auth/helpers";
import { LIMITS } from "@birlinq/api";
import { useApi, useHref } from "@birlinq/platform";
import { ApiRequestError, isValidationError } from "@birlinq/api";

interface FormState {
  token?: string;
  password?: string;
  confirm?: string;
  form?: string;
}

function ResetPasswordForm() {
  const t = useTranslations("auth");
  const api = useApi();
  const href = useHref();
  const searchParams = useSearchParams();

  /**
   * The reset email carries no link — RequestPasswordResetAction mails the raw
   * 64-hex token as a code to paste. So `?token=` is an optional convenience
   * (a deep link, if one is ever added), not the only way in: without it the
   * field below is shown so the user can paste what they actually received.
   */
  const tokenFromUrl = searchParams.get("token");
  const [token, setToken] = useState(tokenFromUrl ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FormState>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
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
        <h1 className="mt-5 text-2xl font-bold">{t("reset.successTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("reset.successText")}</p>
        <Link
          href={href("/login")}
          className="mt-8 inline-flex h-[50px] w-full items-center justify-center rounded-(--radius-btn) bg-white px-6 text-[15px] font-semibold text-ink-900 transition-colors hover:bg-slate-100"
        >
          {t("reset.toLogin")}
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedToken = token.trim();
    const nextErrors: FormState = {};
    if (!trimmedToken) nextErrors.token = t("errors.required");
    if (password.length < PASSWORD_MIN)
      nextErrors.password = t("errors.passwordMin");
    if (confirm !== password) nextErrors.confirm = t("errors.passwordMismatch");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.auth.resetPassword(trimmedToken, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (isValidationError(err)) {
          const fe = detailsToFieldErrors(err.details);
          setErrors({
            password: fe.password,
            token: fe.token ? t("errors.tokenInvalid") : undefined,
            form: !fe.password && !fe.token ? t("errors.generic") : undefined,
          });
        } else if (err.status === 400) {
          // INVALID_RESET_TOKEN — unknown, already used, or past its 60 min.
          setErrors({ token: t("errors.tokenInvalid") });
        } else if (err.status === 429) {
          setErrors({ form: t("errors.rateLimited") });
        } else {
          setErrors({ form: err.message || t("errors.generic") });
        }
      } else {
        setErrors({ form: t("errors.generic") });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold">{t("reset.title")}</h1>
      <p className="mt-1.5 text-sm text-muted">
        {tokenFromUrl ? t("reset.subtitle") : t("reset.subtitleWithToken")}
      </p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4" noValidate>
        {/* Hidden when the token arrived in the URL: nothing to type, and a
            prefilled 64-character field is only noise. */}
        {!tokenFromUrl && (
          <Input
            label={t("fields.resetToken")}
            hint={t("fields.resetTokenHint")}
            placeholder={t("fields.resetTokenPlaceholder")}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            error={errors.token}
            autoComplete="one-time-code"
            spellCheck={false}
            maxLength={LIMITS.token}
            className="font-mono text-[13px]"
          />
        )}
        {tokenFromUrl && errors.token && <FormAlert>{errors.token}</FormAlert>}

        <Input
          label={t("fields.newPassword")}
          type="password"
          autoComplete="new-password"
          placeholder={t("fields.passwordPlaceholder")}
          hint={t("fields.passwordHint")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          maxLength={LIMITS.password}
        />
        <Input
          label={t("fields.confirmPassword")}
          type="password"
          autoComplete="new-password"
          placeholder={t("fields.passwordPlaceholder")}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
          maxLength={LIMITS.password}
        />

        {errors.form && <FormAlert>{errors.form}</FormAlert>}

        <Button type="submit" loading={submitting} className="mt-1 w-full">
          {t("reset.submit")}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm">
        <Link
          href={href("/forgot-password")}
          className="text-muted underline-offset-4 hover:text-white hover:underline"
        >
          {t("reset.requestNew")}
        </Link>
      </p>

      {/* A successful reset revokes every refresh token, so all other devices
          are signed out too — better said up front than discovered later. */}
      <p className="mt-4 text-center text-[12px] leading-relaxed text-muted-2">
        {t("reset.signsOutEverywhere")}
      </p>
    </>
  );
}

export function ResetPasswordView() {
  return (
    <AuthShell>
      <Suspense fallback={<PageSpinner />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
