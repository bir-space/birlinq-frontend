"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormAlert } from "@/components/auth/FormAlert";
import { MethodToggle } from "@/components/auth/MethodToggle";
import {
  PASSWORD_MIN,
  detailsToFieldErrors,
  identifierPayload,
  validateIdentifier,
  type AuthMethod,
} from "@/components/auth/helpers";
import { toApiLocale } from "@birlinq/api";
import { useApi } from "@birlinq/platform";
import { ApiRequestError, isValidationError } from "@birlinq/api";
import { useAuth } from "@birlinq/core";

type Tab = "register" | "login";

interface FormState {
  name?: string;
  identifier?: string;
  password?: string;
  terms?: string;
  form?: string;
}

/** A2 — inline auth gate of the activation wizard (register by default). */
export function AuthStep({
  loginNextHref,
  onDone,
}: {
  /** href of the standalone login page carrying ?next= back to this activation */
  loginNextHref: string;
  onDone: () => void;
}) {
  const t = useTranslations("auth");
  const ta = useTranslations("activation.auth");
  const locale = useLocale();
  const { refresh } = useAuth();
  const api = useApi();

  const [tab, setTab] = useState<Tab>("register");
  const [name, setName] = useState("");
  const [method, setMethod] = useState<AuthMethod>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<FormState>({});
  const [submitting, setSubmitting] = useState(false);

  function switchTab(next: Tab) {
    setTab(next);
    setErrors({});
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const isRegister = tab === "register";
    const nextErrors: FormState = {};
    if (isRegister && !name.trim()) nextErrors.name = t("errors.required");
    const idError = validateIdentifier(method, identifier);
    if (idError) nextErrors.identifier = t(`errors.${idError}`);
    if (isRegister) {
      if (password.length < PASSWORD_MIN)
        nextErrors.password = t("errors.passwordMin");
      if (!terms) nextErrors.terms = t("register.termsRequired");
    } else if (!password) {
      nextErrors.password = t("errors.required");
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      if (isRegister) {
        await api.auth.register({
          name: name.trim(),
          ...identifierPayload(method, identifier),
          password,
          locale: toApiLocale(locale),
        });
      } else {
        await api.auth.login({
          ...identifierPayload(method, identifier),
          password,
        });
      }
      await refresh();
      onDone();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (isValidationError(err)) {
          const fe = detailsToFieldErrors(err.details);
          const idMsg = fe[method] ?? fe.email ?? fe.phone;
          setErrors({
            name: fe.name,
            // On register a server-side identifier error means "already taken".
            identifier: idMsg
              ? isRegister
                ? t("errors.accountExists")
                : idMsg
              : undefined,
            password: fe.password,
            form:
              !fe.name && !idMsg && !fe.password
                ? t("errors.generic")
                : undefined,
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
    } finally {
      setSubmitting(false);
    }
  }

  const isRegister = tab === "register";

  return (
    <div className="pt-2">
      <h1 className="text-2xl font-bold">
        {isRegister ? ta("title") : ta("loginTitle")}
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        {isRegister ? ta("subtitle") : ta("loginSubtitle")}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        {isRegister && (
          <Input
            label={t("fields.name")}
            autoComplete="name"
            placeholder={t("fields.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
        )}

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
          autoComplete={isRegister ? "new-password" : "current-password"}
          placeholder={t("fields.passwordPlaceholder")}
          hint={isRegister ? t("fields.passwordHint") : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        {isRegister && (
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
        )}

        {errors.form && <FormAlert>{errors.form}</FormAlert>}

        <Button type="submit" loading={submitting} className="mt-1 w-full">
          {isRegister ? t("register.submit") : t("login.submit")}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {isRegister ? (
          <>
            {t("register.haveAccount")}{" "}
            <button
              type="button"
              onClick={() => switchTab("login")}
              className="cursor-pointer font-semibold text-white underline-offset-4 hover:underline"
            >
              {ta("tabLogin")}
            </button>
          </>
        ) : (
          <>
            {t("login.noAccount")}{" "}
            <button
              type="button"
              onClick={() => switchTab("register")}
              className="cursor-pointer font-semibold text-white underline-offset-4 hover:underline"
            >
              {ta("tabRegister")}
            </button>
          </>
        )}
      </p>

      <p className="mt-3 text-center">
        <Link
          href={loginNextHref}
          className="text-[13px] text-muted-2 underline-offset-4 hover:text-white hover:underline"
        >
          {ta("fullPage")}
        </Link>
      </p>

      {isRegister && (
        <div className="mt-8 flex items-start gap-3 rounded-(--radius-card) border border-card-border bg-card p-4">
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
      )}
    </div>
  );
}
