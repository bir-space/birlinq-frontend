"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LeadForm } from "./LeadForm";
import { IconCar, IconCheck, IconShieldCheck } from "./icons";

/**
 * P3 — thank-you screen after a scenario submission. Shows the optional
 * "show_message" action payload from the owner, a privacy reassurance banner
 * and the "I want such a sticker" lead block.
 */
export function ThankYouScreen({
  code,
  ownerMessage,
  onClose,
}: {
  code: string;
  ownerMessage: string | null;
  onClose: () => void;
}) {
  const t = useTranslations("public");

  return (
    <div className="flex flex-col">
      {/* Success mark */}
      <div className="mt-4 flex flex-col items-center text-center">
        <div className="flex size-24 items-center justify-center rounded-full bg-accent/15">
          <div className="flex size-16 items-center justify-center rounded-full bg-accent text-ink-900">
            <IconCheck className="size-8" strokeWidth={2.4} />
          </div>
        </div>
        <h1 className="mt-6 text-2xl font-bold">{t("thanks.title")}</h1>
        <p className="mt-2 max-w-xs text-sm text-muted">
          {t("thanks.subtitle")}
        </p>
      </div>

      {/* Owner's "show_message" action */}
      {ownerMessage && (
        <Card className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-2">
            {t("thanks.ownerMessage")}
          </p>
          <p className="mt-2 text-[14px] leading-relaxed">{ownerMessage}</p>
        </Card>
      )}

      {/* Privacy reassurance */}
      <div className="mt-6 flex items-start gap-3 rounded-(--radius-card) border border-accent/20 bg-accent/10 p-4">
        <IconShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" />
        <div>
          <p className="text-[13px] font-semibold text-accent">
            {t("thanks.privacyTitle")}
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            {t("thanks.privacyText")}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="mt-8 flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        <span className="text-[12px] text-muted-2">
          {t("thanks.leadDivider")}
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      {/* Lead block */}
      <Card className="mt-4">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-card-border bg-ink-soft text-accent">
            <IconCar className="size-6" />
          </span>
          <div>
            <p className="text-[14px] font-bold">{t("lead.cardTitle")}</p>
            <p className="mt-0.5 text-[12px] text-muted">
              {t("lead.cardText")}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <LeadForm code={code} />
        </div>
      </Card>

      <Button variant="ghost" className="mt-4 w-full" onClick={onClose}>
        {t("thanks.close")}
      </Button>
    </div>
  );
}
