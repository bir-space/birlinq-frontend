"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormAlert } from "@/components/auth/FormAlert";
import { EMAIL_RE, detailsToFieldErrors } from "@/components/auth/helpers";
import { mockAuthApi as authApi } from "@/lib/mock/mock-endpoints";
import { ApiRequestError } from "@/lib/api/client";
import { MockBanner } from "@/components/mock/MockBanner";

export default function MockForgotPasswordPage() {
  const t = useTranslations("auth");

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const value = email.trim();
    if (!value) {
      setFieldError(t("errors.required"));
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setFieldError(t("errors.invalidEmail"));
      return;
    }
    setFieldError(null);

    setSubmitting(true);
    try {
      await authApi.forgotPassword(value);
      setSent(true);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.code === "VALIDATION_FAILED") {
          const fe = detailsToFieldErrors(err.details);
          setFieldError(fe.email ?? t("errors.invalidEmail"));
        } else if (err.status === 429) {
          setFormError(t("errors.rateLimited"));
        } else {
          setFormError(err.message || t("errors.generic"));
        }
      } else {
        setFormError(t("errors.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <MockBanner />
      <AuthShell>
        {sent ? (
          <div className="flex flex-col items-center pt-10 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 7l8 6 8-6M4 7v10h16V7M4 7h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <h1 className="mt-5 text-2xl font-bold">{t("forgot.successTitle")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {t("forgot.successText", { email })}
            </p>
            <Link
              href="/mock/login"
              className="mt-8 inline-flex h-[50px] w-full items-center justify-center rounded-(--radius-btn) bg-white px-6 text-[15px] font-semibold text-ink-900 transition-colors hover:bg-slate-100"
            >
              {t("forgot.backToLogin")}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold">{t("forgot.title")}</h1>
            <p className="mt-1.5 text-sm text-muted">{t("forgot.subtitle")}</p>

            <form
              onSubmit={handleSubmit}
              className="mt-7 flex flex-col gap-4"
              noValidate
            >
              <Input
                label={t("fields.email")}
                type="email"
                autoComplete="email"
                placeholder={t("fields.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={fieldError}
              />

              {formError && <FormAlert>{formError}</FormAlert>}

              <Button type="submit" loading={submitting} className="mt-1 w-full">
                {t("forgot.submit")}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm">
              <Link
                href="/mock/login"
                className="text-muted underline-offset-4 hover:text-white hover:underline"
              >
                {t("forgot.backToLogin")}
              </Link>
            </p>
          </>
        )}
      </AuthShell>
    </>
  );
}
