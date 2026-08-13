"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PublicEntityPayload, PublicScenario } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LeadForm } from "./LeadForm";
import {
  IconCar,
  IconChevronRight,
  IconShieldCheck,
  ScenarioIcon,
} from "./icons";

/** Human title for the scanned entity: custom title → make+model → fallback. */
export function entityTitle(
  payload: PublicEntityPayload,
  fallback: string
): string {
  const v = payload.entity.vehicle;
  const makeModel = [v?.make, v?.model].filter(Boolean).join(" ");
  return payload.entity.title || makeModel || fallback;
}

/**
 * P1 — main public page after scanning a car QR: vehicle card with privacy
 * badge, scenario list, privacy banner and the "I want a sticker" lead block.
 */
export function EntityView({
  payload,
  code,
  onSelectScenario,
}: {
  payload: PublicEntityPayload;
  code: string;
  onSelectScenario: (scenario: PublicScenario) => void;
}) {
  const t = useTranslations("public");
  const [leadOpen, setLeadOpen] = useState(false);

  const vehicle = payload.entity.vehicle;
  const makeModel = [vehicle?.make, vehicle?.model].filter(Boolean).join(" ");
  const title = entityTitle(payload, t("entity.vehicleFallback"));
  const subtitle = [
    vehicle?.color,
    makeModel && makeModel !== title ? makeModel : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col">
      {/* Vehicle card */}
      <Card className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-card-border bg-ink-soft text-accent">
          <IconCar className="size-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[18px] font-bold leading-snug">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {vehicle?.plate_number && (
              <span className="inline-flex items-center rounded-lg border border-line bg-ink-soft px-2 py-0.5 font-mono text-[12px] font-semibold tracking-wider text-white">
                {vehicle.plate_number}
              </span>
            )}
            {payload.meta.privacy_badge !== false && (
              <Badge tone="accent" className="normal-case tracking-normal">
                <IconShieldCheck className="size-3" />
                {t("entity.hiddenBadge")}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Scenario list */}
      <section className="mt-8">
        <h2 className="text-[22px] font-bold">{t("entity.whatHappened")}</h2>
        <p className="mt-1 text-[13px] text-muted">{t("entity.choose")}</p>
        <ul className="mt-4 flex flex-col gap-3">
          {payload.scenarios.map((scenario) => (
            <li key={scenario.id}>
              <button
                type="button"
                onClick={() => onSelectScenario(scenario)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-(--radius-card) border border-card-border bg-card p-4 text-left transition-colors hover:bg-[#16233d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ink-soft text-accent">
                  <ScenarioIcon
                    hint={`${scenario.icon ?? ""} ${scenario.code}`}
                    className="size-5"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium text-white">
                    {scenario.title}
                  </span>
                  {scenario.description && (
                    <span className="mt-0.5 block text-[12px] text-muted-2">
                      {scenario.description}
                    </span>
                  )}
                </span>
                <IconChevronRight className="size-4 shrink-0 text-muted-2" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Privacy banner */}
      <div className="mt-6 flex items-start gap-3 rounded-(--radius-card) border border-accent/20 bg-accent/10 p-4">
        <IconShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" />
        <div>
          <p className="text-[13px] font-semibold text-accent">
            {t("entity.privacyTitle")}
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            {t("entity.privacyText")}
          </p>
        </div>
      </div>

      {/* Lead CTA / inline lead form */}
      <div className="mt-6">
        {leadOpen ? (
          <Card>
            <p className="text-[15px] font-bold">{t("lead.cardTitle")}</p>
            <p className="mt-0.5 text-[12px] text-muted">
              {t("lead.cardText")}
            </p>
            <div className="mt-4">
              <LeadForm code={code} />
            </div>
          </Card>
        ) : (
          <button
            type="button"
            onClick={() => setLeadOpen(true)}
            className="w-full cursor-pointer rounded-(--radius-card) border border-line p-4 text-center transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="block text-[15px] font-bold text-white">
              {t("lead.cta")}
            </span>
            <span className="mt-0.5 block text-[11px] text-muted-2">
              {t("lead.ctaSub")}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
