"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormAlert } from "@/components/auth/FormAlert";
import { MethodToggle } from "@/components/auth/MethodToggle";
import {
  detailsToFieldErrors,
  identifierPayload,
  safeNext,
  validateIdentifier,
  type AuthMethod,
} from "@/components/auth/helpers";
import { useApi, useHref } from "@/lib/app-env";
import { ApiRequestError, isValidationError } from "@/lib/api/client";
import { LIMITS } from "@/lib/api/limits";
import { useAuth } from "@/lib/auth/use-auth";

interface FormState {
  identifier?: string;
  password?: string;
  form?: string;
}

function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const api = useApi();
  const href = useHref();
  const next = safeNext(searchParams.get("next"));

  const [method, setMethod] = useState<AuthMethod>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormState>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: FormState = {};
    const idError = validateIdentifier(method, identifier);
    if (idError) nextErrors.identifier = t(`errors.${idError}`);
    if (!password) nextErrors.password = t("errors.required");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.auth.login({
        ...identifierPayload(method, identifier),
        password,
      });
      await refresh();
      router.replace(next ?? href("/dashboard"));
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (isValidationError(err)) {
          const fe = detailsToFieldErrors(err.details);
          const idMsg = fe[method] ?? fe.email ?? fe.phone;
          setErrors({
            identifier: idMsg,
            password: fe.password,
            form: !idMsg && !fe.password ? t("errors.generic") : undefined,
          });
        } else if (err.status === 401) {
          setErrors({ form: t("errors.invalidCredentials") });
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
    // keep the spinner while router.replace navigates
  }

  const registerHref = href(
    next ? `/register?next=${encodeURIComponent(next)}` : "/register"
  );

  return (
    <>
      <h1 className="text-2xl font-bold">{t("login.title")}</h1>
      <p className="mt-1.5 text-sm text-muted">{t("login.subtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4" noValidate>
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
            maxLength={LIMITS.email}
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
          autoComplete="current-password"
          placeholder={t("fields.passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          maxLength={LIMITS.password}
        />

        {errors.form && <FormAlert>{errors.form}</FormAlert>}

        <Button type="submit" loading={submitting} className="mt-1 w-full">
          {t("login.submit")}
        </Button>
      </form>

      <div className="mt-5 flex flex-col items-center gap-3 text-sm">
        <Link
          href={href("/forgot-password")}
          className="text-muted underline-offset-4 hover:text-white hover:underline"
        >
          {t("login.forgot")}
        </Link>
        <p className="text-muted">
          {t("login.noAccount")}{" "}
          <Link
            href={registerHref}
            className="font-semibold text-white underline-offset-4 hover:underline"
          >
            {t("login.registerLink")}
          </Link>
        </p>
      </div>
    </>
  );
}

export function LoginView() {
  return (
    <AuthShell>
      <Suspense fallback={<PageSpinner />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
