"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toApiLocale } from "@/lib/api/endpoints";
import { mockPublicApi as publicApi } from "@/lib/mock/mock-endpoints";
import { ApiRequestError } from "@/lib/api/client";
import type { PublicScenario } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { IconArrowLeft, IconClose, IconInfo, ScenarioIcon } from "./icons";

const MESSAGE_LIMIT = 500;

/**
 * P2 — scenario message form. Textarea prefilled from the scenario, 500 char
 * limit, submits via publicApi.submitScenario. 429 shows an inline friendly
 * error, 410/404 bubble up as fatal page states.
 */
export function ScenarioForm({
  code,
  scenario,
  entityLabel,
  onBack,
  onSubmitted,
  onFatal,
}: {
  code: string;
  scenario: PublicScenario;
  entityLabel: string;
  onBack: () => void;
  onSubmitted: (ownerMessage: string | null) => void;
  onFatal: (kind: "not_found" | "unavailable") => void;
}) {
  const t = useTranslations("public");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [message, setMessage] = useState(
    (scenario.prefilled_message ?? "").slice(0, MESSAGE_LIMIT)
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = message.trim();
    if (!text) {
      setError(t("scenario.empty"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await publicApi.submitScenario(code, scenario.id, {
        message: text,
        visitor_locale: toApiLocale(locale),
      });
      const action = result.actions?.find((a) => a.type === "show_message");
      const raw = action?.payload?.message;
      onSubmitted(typeof raw === "string" ? raw : null);
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ApiRequestError) {
        if (err.status === 429 || err.code === "RATE_LIMITED") {
          setError(t("scenario.rateLimited"));
        } else if (err.status === 410) {
          onFatal("unavailable");
        } else if (err.status === 404) {
          onFatal("not_found");
        } else {
          setError(t("errors.genericText"));
        }
      } else {
        setError(t("errors.genericText"));
      }
    }
  }

  const iconBtn =
    "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-card hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  return (
    <div className="flex flex-1 flex-col">
      {/* Screen header: back · title · close */}
      <header className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={tCommon("back")}
          className={iconBtn}
        >
          <IconArrowLeft className="size-5" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center text-[16px] font-bold">
          {scenario.title}
        </h1>
        <button
          type="button"
          onClick={onBack}
          aria-label={tCommon("cancel")}
          className={iconBtn}
        >
          <IconClose className="size-5" />
        </button>
      </header>

      {/* "Message goes to the owner" banner */}
      <div className="flex items-center gap-3 rounded-(--radius-card) border border-card-border bg-card p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <ScenarioIcon
            hint={`${scenario.icon ?? ""} ${scenario.code}`}
            className="size-5"
          />
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold">{t("scenario.banner")}</p>
          <p className="truncate text-[12px] text-muted">
            {entityLabel
              ? `${entityLabel} · ${t("scenario.bannerPrivacy")}`
              : t("scenario.bannerPrivacy")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col">
        <div className="mb-1.5 flex items-baseline justify-between">
          <label
            htmlFor="scenario-message"
            className="text-[13px] font-medium text-muted"
          >
            {t("scenario.messageLabel")}
          </label>
          <span className="text-[11px] tabular-nums text-muted-2">
            {message.length} / {MESSAGE_LIMIT}
          </span>
        </div>
        <Textarea
          id="scenario-message"
          value={message}
          onChange={(e) =>
            setMessage(e.target.value.slice(0, MESSAGE_LIMIT))
          }
          maxLength={MESSAGE_LIMIT}
          error={error}
          className="min-h-40"
          autoFocus
        />
        {!error && (
          <p className="mt-1.5 text-[11px] text-muted-2">
            {t("scenario.editHint")}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={submitting}
          >
            {t("scenario.send")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={onBack}
          >
            {t("scenario.cancel")}
          </Button>
        </div>
      </form>

      {/* Anti-abuse note */}
      <div className="mt-auto pt-8">
        <div className="flex items-start gap-3 rounded-(--radius-card) border border-line p-4">
          <IconInfo className="mt-0.5 size-4 shrink-0 text-muted-2" />
          <p className="text-[11px] leading-relaxed text-muted-2">
            {t("scenario.spamNote")}
          </p>
        </div>
      </div>
    </div>
  );
}
