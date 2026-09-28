"use client";

import { useTranslations } from "next-intl";
import type { PrivacySettings } from "@birlinq/api";
import {
  CARD_PRIVACY_GROUPS,
  CARD_PRIVACY_PRESETS,
  activeCardPreset,
  type CardPrivacyGroup,
  type CardPrivacyKey,
  type CardPrivacyPreset,
} from "@birlinq/core";
import { Toggle } from "@/components/dashboard/bits";

const GROUPS = Object.keys(CARD_PRIVACY_GROUPS) as CardPrivacyGroup[];

/**
 * The 15 card switches in two groups, with the three presets above them.
 * The preset that matches the current switches is highlighted; when none
 * does, a "custom" pill says so. Every change goes up as a callback — the
 * hook behind it does the optimistic flip and the rollback.
 */
export function PrivacyList({
  settings,
  onToggle,
  onPreset,
  busyKey = null,
  presetBusy = false,
  disabled = false,
  error = null,
}: {
  settings: PrivacySettings;
  onToggle: (key: CardPrivacyKey, value: boolean) => void;
  onPreset: (preset: CardPrivacyPreset) => void;
  /** The switch in flight — only it is shown busy, the rest stay usable-looking. */
  busyKey?: CardPrivacyKey | null;
  presetBusy?: boolean;
  disabled?: boolean;
  error?: string | null;
}) {
  const t = useTranslations("cards.privacy");
  const active = activeCardPreset(settings);
  const locked = disabled || presetBusy || busyKey !== null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-2">
          {t("presets.title")}
        </p>
        <div className="flex flex-wrap gap-2">
          {CARD_PRIVACY_PRESETS.map((preset) => {
            const selected = active === preset;
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={selected}
                title={t(`presets.${preset}Hint`)}
                disabled={locked}
                onClick={() => onPreset(preset)}
                className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-card-border bg-ink-soft text-muted hover:border-line hover:text-white"
                }`}
              >
                {t(`presets.${preset}`)}
              </button>
            );
          })}
          {active === null && (
            <span className="inline-flex items-center rounded-full border border-dashed border-line px-3.5 py-1.5 text-[13px] font-semibold text-muted-2">
              {t("presets.custom")}
            </span>
          )}
        </div>
        {active && (
          <p className="mt-2 text-[12px] text-muted-2">
            {t(`presets.${active}Hint`)}
          </p>
        )}
      </div>

      {GROUPS.map((group) => (
        <div key={group}>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-2">
            {t(`groups.${group}`)}
          </p>
          <ul className="divide-y divide-card-border">
            {CARD_PRIVACY_GROUPS[group].map((key) => (
              <li
                key={key}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="text-[14px]">{t(`keys.${key}`)}</span>
                <span className="flex items-center gap-2">
                  {busyKey === key && (
                    <span
                      className="size-3.5 animate-spin rounded-full border-2 border-muted border-t-accent"
                      aria-hidden="true"
                    />
                  )}
                  <Toggle
                    checked={settings[key]}
                    disabled={locked}
                    onToggle={() => onToggle(key, !settings[key])}
                    label={t(`keys.${key}`)}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {error && <p className="text-[13px] text-danger">{error}</p>}
    </div>
  );
}
