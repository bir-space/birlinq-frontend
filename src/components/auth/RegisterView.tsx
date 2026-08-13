"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormAlert } from "@/components/auth/FormAlert";
import { MethodToggle } from "@/components/auth/MethodToggle";
import {
  PASSWORD_MIN,
  detailsToFieldErrors,
  identifierPayload,
  safeNext,
  validateIdentifier,
  type AuthMethod,
} from "@/components/auth/helpers";
import { toApiLocale } from "@/lib/api/endpoints";
import { useApi, useHref } from "@/lib/app-env";
import { ApiRequestError, isValidationError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/use-auth";

interface FormState {
  name?: string;
  identifier?: string;
  password?: string;
  terms?: string;
  form?: string;
}

function RegisterForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const api = useApi();
  const href = useHref();
  const next = safeNext(searchParams.get("next"));

  const [name, setName] = useState("");
  const [method, setMethod] = useState<AuthMethod>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<FormState>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: FormState = {};
    if (!name.trim()) nextErrors.name = t("errors.required");
    const idError = validateIdentifier(method, identifier);
    if (idError) nextErrors.identifier = t(`errors.${idError}`);
    if (password.length < PASSWORD_MIN)
      nextErrors.password = t("errors.passwordMin");
    if (!terms) nextErrors.terms = t("register.termsRequired");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.auth.register({
        name: name.trim(),
        ...identifierPayload(method, identifier),
        password,
        locale: toApiLocale(locale),
      });
      await refresh();
      router.replace(next ?? href("/dashboard"));
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (isValidationError(err)) {
          const fe = detailsToFieldErrors(err.details);
          // The identifier passed client-side validation, so a server-side
          // complaint about it is the `unique` rule — show the localized copy.
          const idMsg = fe[method] ?? fe.email ?? fe.phone;
          setErrors({
            name: fe.name,
            identifier: idMsg ? t("errors.accountExists") : undefined,
            password: fe.password,
            form:
              !fe.name && !idMsg && !fe.password
                ? t("errors.generic")
                : undefined,
          });
        } else if (err.status === 429) {
          setErrors({ form: t("errors.rateLimited") });
        } else {
          setErrors({ form: err.message || t("errors.generic") });
        }
      } else {
        setErrors({ form: t("errors.generic") });
      }
      setSubmitting(false);
      return;
    }
  }

  const loginHref = href(
    next ? `/login?next=${encodeURIComponent(next)}` : "/login"
  );

  return (
    <>
      <h1 className="text-2xl font-bold">{t("register.title")}</h1>
      <p className="mt-1.5 text-sm text-muted">{t("register.subtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4" noValidate>
        <Input
          label={t("fields.name")}
          autoComplete="name"
          placeholder={t("fields.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <MethodToggle
          value={method}
          onChange={(m) => {
            setMethod(m);
            setErrors((prev) => ({ ...prev, identifier: undefined }));
          }}
          emailLabel={t("method.email")}
          phoneLabel={t("method.phone")}
        />

        {method === "email" ? (
          <Input
            label={t("fields.email")}
            type="email"
            autoComplete="email"
            placeholder={t("fields.emailPlaceholder")}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            error={errors.identifier}
          />
        ) : (
          <Input
            label={t("fields.phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t("fields.phonePlaceholder")}
            hint={t("fields.phoneHint")}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            error={errors.identifier}
          />
        )}

        <Input
          label={t("fields.password")}
          type="password"
          autoComplete="new-password"
          placeholder={t("fields.passwordPlaceholder")}
          hint={t("fields.passwordHint")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        <div className="flex flex-col gap-1.5">
          <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-snug text-muted">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-accent"
            />
            <span>{t("register.terms")}</span>
          </label>
          {errors.terms && (
            <p className="text-[12px] text-danger">{errors.terms}</p>
          )}
        </div>

        {errors.form && <FormAlert>{errors.form}</FormAlert>}

        <Button type="submit" loading={submitting} className="mt-1 w-full">
          {t("register.submit")}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {t("register.haveAccount")}{" "}
        <Link
          href={loginHref}
          className="font-semibold text-white underline-offset-4 hover:underline"
        >
          {t("register.loginLink")}
        </Link>
      </p>

      <div className="mt-10 flex items-start gap-3 rounded-(--radius-card) border border-card-border bg-card p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 3l7 3v5c0 4.5-3 8.4-7 10-4-1.6-7-5.5-7-10V6l7-3z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className="text-[12px] leading-snug">
          <p className="font-semibold text-white">{t("register.bannerTitle")}</p>
          <p className="mt-0.5 text-muted">{t("register.bannerText")}</p>
        </div>
      </div>
    </>
  );
}

export function RegisterView() {
  return (
    <AuthShell>
      <Suspense fallback={<PageSpinner />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
