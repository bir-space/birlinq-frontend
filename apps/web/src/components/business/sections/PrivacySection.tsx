"use client";

import { useTranslations } from "next-intl";
import { DEFAULT_PRIVACY } from "@birlinq/api";
import { PrivacyList } from "@/components/forms/PrivacyList";
import { Section, type SectionProps } from "./shared";

/**
 * The fifteen card switches and the three presets. Every flip is its own
 * optimistic PATCH inside the hook, so there is no save button — the list
 * shows which switch is in flight and the outcome of the last one.
 */
export function PrivacySection({ card, entity, feedback, run }: SectionProps) {
  const t = useTranslations("cards");
  const settings = entity.privacy_settings ?? DEFAULT_PRIVACY;
  const inFlight = card.busy === "privacy";

  const error =
    feedback === "error"
      ? card.actionError === "blocked"
        ? t("edit.blocked")
        : card.actionError === "rateLimited"
          ? t("edit.rateLimited")
          : t("privacy.error")
      : null;

  return (
    <Section id="privacy" title={t("sections.privacy")} hint={t("privacy.hint")}>
      <PrivacyList
        settings={settings}
        onToggle={(key, value) => {
          void run(() => card.togglePrivacy(key, value));
        }}
        onPreset={(preset) => {
          void run(() => card.applyPrivacyPreset(preset));
        }}
        busyKey={card.privacyBusy}
        presetBusy={inFlight && card.privacyBusy === null}
        disabled={card.busy !== null && !inFlight}
        error={error}
      />
    </Section>
  );
}
