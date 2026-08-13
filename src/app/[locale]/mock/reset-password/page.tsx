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
import { mockAuthApi as authApi } from "@/lib/mock/mock-endpoints";
import { ApiRequestError } from "@/lib/api/client";
import { MockBanner } from "@/components/mock/MockBanner";

interface FormState {
  password?: string;
  confirm?: string;
  form?: string;
}

function ResetPasswordForm() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  // Defaults to a fixture token so the page demoes the working form by
  // default; pass ?token= (any value) or ?token= empty string to see the
  // "missing token" state instead.
  const token = searchParams.has("token")
    ? searchParams.get("token")
    : "mock-reset-token";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FormState>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="flex flex-col gap-5 pt-4">
        <h1 className="text-2xl font-bold">{t("reset.title")}</h1>
        <FormAlert>{t("errors.tokenMissing")}</FormAlert>
        <Link
          href="/mock/forgot-password"
          className="inline-flex h-[50px] w-full items-center justify-center rounded-(--radius-btn) bg-white px-6 text-[15px] font-semibold text-ink-900 transition-colors hover:bg-slate-100"
        >
          {t("reset.requestNew")}
        </Link>
      </div>
    );
  }

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
          href="/mock/login"
          className="mt-8 inline-flex h-[50px] w-full items-center justify-center rounded-(--radius-btn) bg-white px-6 text-[15px] font-semibold text-ink-900 transition-colors hover:bg-slate-100"
        >
          {t("reset.toLogin")}
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: FormState = {};
    if (password.length < PASSWORD_MIN)
      nextErrors.password = t("errors.passwordMin");
    if (confirm !== password) nextErrors.confirm = t("errors.passwordMismatch");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await authApi.resetPassword(token as string, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.code === "VALIDATION_FAILED") {
          const fe = detailsToFieldErrors(err.details);
          setErrors({
            password: fe.password,
            form: fe.token
              ? t("errors.tokenInvalid")
              : !fe.password
                ? t("errors.generic")
                : undefined,
          });
        } else if (err.status === 400 || err.status === 404 || err.status === 410) {
          setErrors({ form: t("errors.tokenInvalid") });
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
      <p className="mt-1.5 text-sm text-muted">{t("reset.subtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4" noValidate>
        <Input
          label={t("fields.newPassword")}
          type="password"
          autoComplete="new-password"
          placeholder={t("fields.passwordPlaceholder")}
          hint={t("fields.passwordHint")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Input
          label={t("fields.confirmPassword")}
          type="password"
          autoComplete="new-password"
          placeholder={t("fields.passwordPlaceholder")}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />

        {errors.form && <FormAlert>{errors.form}</FormAlert>}

        <Button type="submit" loading={submitting} className="mt-1 w-full">
          {t("reset.submit")}
        </Button>
      </form>
    </>
  );
}

export default function MockResetPasswordPage() {
  return (
    <>
      <MockBanner />
      <AuthShell>
        <Suspense fallback={<PageSpinner />}>
          <ResetPasswordForm />
        </Suspense>
      </AuthShell>
    </>
  );
}
