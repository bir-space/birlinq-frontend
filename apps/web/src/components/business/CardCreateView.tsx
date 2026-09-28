"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { LIMITS, type CardTheme } from "@birlinq/api";
import { useHref } from "@birlinq/platform";
import {
  CARD_PRIVACY_PRESETS,
  PRIVACY_PRESETS,
  useCreateCard,
  type CardPrivacyPreset,
} from "@birlinq/core";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import {
  AliasInput,
  aliasIssue,
  trimAliasDashes,
} from "@/components/forms/AliasInput";
import { ThemePicker } from "@/components/forms/ThemePicker";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BackLink, IconCheck, SectionLabel } from "@/components/dashboard/bits";

const NAME_MIN = 2;

export function CardCreateView({ banner }: { banner?: ReactNode }) {
  return (
    <DashboardShell banner={banner}>
      <CardCreate />
    </DashboardShell>
  );
}

interface LocalErrors {
  displayName?: string;
  alias?: string;
}

/**
 * The essentials of a new card in one POST: name (required), title and
 * company, a theme, an optional address and a privacy preset — `contact`
 * and `privacy_settings` ride inside the create request (D-041). Everything
 * else is added on the edit page the owner lands on afterwards.
 */
function CardCreate() {
  const t = useTranslations("cards");
  const tAlias = useTranslations("cards.alias");
  const router = useRouter();
  const href = useHref();
  const { submitting, error, fieldErrors, create, clearError } = useCreateCard();

  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [theme, setTheme] = useState<CardTheme>("default");
  const [alias, setAlias] = useState("");
  const [preset, setPreset] = useState<CardPrivacyPreset>("card");
  const [localErrors, setLocalErrors] = useState<LocalErrors>({});
  const [limitOpen, setLimitOpen] = useState(false);

  useEffect(() => {
    if (error === "cardLimit") setLimitOpen(true);
  }, [error]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const name = displayName.trim();
    const next: LocalErrors = {};
    if (!name) next.displayName = t("create.errors.nameRequired");
    else if (name.length < NAME_MIN)
      next.displayName = t("create.errors.nameMin", { n: NAME_MIN });
    const slug = trimAliasDashes(alias);
    if (slug !== alias) setAlias(slug);
    const issue = aliasIssue(slug);
    if (issue) next.alias = tAlias(`errors.${issue}`, { n: LIMITS.aliasMin });
    setLocalErrors(next);
    if (next.displayName || next.alias) return;

    const entity = await create({
      contact: {
        display_name: name,
        title: title.trim() || null,
        company: company.trim() || null,
        theme,
      },
      privacy_settings: PRIVACY_PRESETS[preset],
      ...(slug ? { alias: slug } : {}),
    });
    if (entity) router.replace(href(`/dashboard/cards/${entity.id}`));
  };

  const nameError =
    localErrors.displayName ??
    (error === "validation" ? (fieldErrors.display_name ?? null) : null);
  const aliasError =
    localErrors.alias ??
    (error === "aliasTaken"
      ? t("create.errors.aliasTaken")
      : error === "validation"
        ? (fieldErrors.alias ?? null)
        : null);
  const formError =
    error === "rateLimited"
      ? t("create.errors.rateLimited")
      : error === "create"
        ? t("create.errors.generic")
        : error === "validation" && !nameError && !aliasError
          ? t("errors.validation")
          : null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <BackLink href={href("/dashboard/cards")} label={t("edit.back")} />

      <div>
        <h1 className="text-[24px] font-bold tracking-tight">
          {t("create.title")}
        </h1>
        <p className="mt-1 text-[13px] text-muted-2">{t("create.subtitle")}</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
        <section>
          <SectionLabel>{t("sections.profile")}</SectionLabel>
          <Card className="flex flex-col gap-4">
            <Input
              label={t("create.fields.displayName")}
              placeholder={t("create.fields.displayNamePlaceholder")}
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setLocalErrors((cur) => ({ ...cur, displayName: undefined }));
              }}
              maxLength={LIMITS.contactDisplayName}
              autoComplete="name"
              autoFocus
              required
              error={nameError}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t("create.fields.title")}
                placeholder={t("create.fields.titlePlaceholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={LIMITS.contactTitle}
                autoComplete="organization-title"
                error={error === "validation" ? (fieldErrors.title ?? null) : null}
              />
              <Input
                label={t("create.fields.company")}
                placeholder={t("create.fields.companyPlaceholder")}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                maxLength={LIMITS.contactCompany}
                autoComplete="organization"
                error={
                  error === "validation" ? (fieldErrors.company ?? null) : null
                }
              />
            </div>
          </Card>
        </section>

        <section>
          <SectionLabel>{t("create.themeTitle")}</SectionLabel>
          <Card>
            <ThemePicker
              value={theme}
              onChange={setTheme}
              disabled={submitting}
              preview={{ name: displayName, title, company }}
            />
          </Card>
        </section>

        <section>
          <SectionLabel>{t("create.aliasTitle")}</SectionLabel>
          <Card>
            <AliasInput
              value={alias}
              onChange={(next) => {
                setAlias(next);
                setLocalErrors((cur) => ({ ...cur, alias: undefined }));
                if (error === "aliasTaken") clearError();
              }}
              hint={t("create.aliasHint")}
              error={aliasError}
              disabled={submitting}
            />
          </Card>
        </section>

        <section>
          <SectionLabel>{t("create.privacyTitle")}</SectionLabel>
          <div
            role="radiogroup"
            aria-label={t("create.privacyTitle")}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {CARD_PRIVACY_PRESETS.map((option) => {
              const selected = option === preset;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={submitting}
                  onClick={() => setPreset(option)}
                  className={`flex cursor-pointer items-start gap-3 rounded-(--radius-card) border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${
                    selected
                      ? "border-accent bg-accent/10"
                      : "border-card-border bg-card hover:border-line"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                      selected
                        ? "border-accent bg-accent text-white"
                        : "border-line"
                    }`}
                    aria-hidden="true"
                  >
                    {selected && <IconCheck className="size-3" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold">
                      {t(`privacy.presets.${option}`)}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-muted-2">
                      {t(`privacy.presets.${option}Hint`)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {formError && (
          <p className="rounded-(--radius-btn) border border-danger/30 bg-danger/10 px-4 py-2.5 text-[13px] text-danger">
            {formError}
          </p>
        )}

        <Button type="submit" loading={submitting} className="w-full sm:w-auto sm:self-start sm:min-w-56">
          {t("create.submit")}
        </Button>
      </form>

      {limitOpen && (
        <ConfirmModal
          title={t("create.limit.title")}
          text={t("create.limit.text")}
          confirmLabel={t("create.limit.cta")}
          cancelLabel={t("create.limit.close")}
          onConfirm={() => router.push(href("/dashboard/pricing"))}
          onClose={() => {
            setLimitOpen(false);
            clearError();
          }}
        />
      )}
    </div>
  );
}
