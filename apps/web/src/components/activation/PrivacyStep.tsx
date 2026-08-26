"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/auth/FormAlert";
import { DEFAULT_PRIVACY, type Entity, type PrivacySettings } from "@/lib/api/types";

/**
 * The car-relevant slice of the backend privacy flags
 * (App\Domain\Entity\Data\PrivacySettingsData). The remaining flags —
 * show_phone2 / show_company / show_bio — belong to the `personal` entity
 * type and are left untouched by this step.
 */
const FLAG_KEYS = [
  "show_display_name",
  "show_phone",
  "show_whatsapp",
  "show_telegram",
  "show_email",
  "show_license_plate",
  "show_year",
] as const;

export type PrivacyFlags = Pick<PrivacySettings, (typeof FLAG_KEYS)[number]>;

type PresetId = "safe" | "open" | "max";

const ALL_OFF: PrivacyFlags = {
  show_display_name: false,
  show_phone: false,
  show_whatsapp: false,
  show_telegram: false,
  show_email: false,
  show_license_plate: false,
  show_year: false,
};

const PRESETS: Record<PresetId, PrivacyFlags> = {
  // Make/model/colour are always shown; the preset only governs the extras.
  safe: { ...ALL_OFF, show_year: true },
  open: {
    show_display_name: true,
    show_phone: true,
    show_whatsapp: true,
    show_telegram: true,
    show_email: true,
    show_license_plate: true,
    show_year: true,
  },
  max: { ...ALL_OFF },
};

/** Pick the car-relevant flags out of a full settings object. */
function toFlags(settings: PrivacySettings | null): PrivacyFlags {
  const source = settings ?? DEFAULT_PRIVACY;
  return Object.fromEntries(
    FLAG_KEYS.map((k) => [k, source[k]])
  ) as PrivacyFlags;
}

function matchesPreset(flags: PrivacyFlags, preset: PrivacyFlags): boolean {
  return FLAG_KEYS.every((k) => flags[k] === preset[k]);
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
        checked ? "bg-accent" : "bg-white/15"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

/** A4 — privacy presets + fine-tuning toggles, then privacy save + QR activation. */
export function PrivacyStep({
  entity,
  submitting,
  errorKey,
  onSubmit,
  onBack,
  onChooseAnother,
}: {
  entity: Entity;
  submitting: boolean;
  /** activation error key within `activation.activationErrors`, or null */
  errorKey: "entityHasQr" | "alreadyActivated" | "generic" | null;
  onSubmit: (settings: PrivacyFlags) => void;
  onBack: () => void;
  onChooseAnother: () => void;
}) {
  const t = useTranslations("activation.privacy");
  const te = useTranslations("activation.activationErrors");
  const tc = useTranslations("common");

  // The entity payload already carries privacy_settings — there is no
  // GET /entities/{id}/privacy endpoint to call.
  const [flags, setFlags] = useState<PrivacyFlags>(() =>
    toFlags(entity.privacy_settings)
  );

  const activePreset = useMemo<PresetId | null>(() => {
    for (const id of ["safe", "open", "max"] as PresetId[]) {
      if (matchesPreset(flags, PRESETS[id])) return id;
    }
    return null;
  }, [flags]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(flags);
  }

  const presets: {
    id: PresetId;
    title: string;
    lines: string[];
    recommended?: boolean;
  }[] = [
    {
      id: "safe",
      title: t("presetSafe"),
      lines: [t("presetSafeLine1"), t("presetSafeLine2"), t("presetSafeLine3")],
      recommended: true,
    },
    {
      id: "open",
      title: t("presetOpen"),
      lines: [t("presetOpenLine1"), t("presetOpenLine2")],
    },
    {
      id: "max",
      title: t("presetMax"),
      lines: [t("presetMaxLine1"), t("presetMaxLine2")],
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="pt-2" noValidate>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-1.5 text-sm text-muted">{t("subtitle")}</p>

      <div className="mt-6 flex flex-col gap-3" role="radiogroup">
        {presets.map((preset) => {
          const selected = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={submitting}
              onClick={() => setFlags({ ...PRESETS[preset.id] })}
              className={`w-full cursor-pointer rounded-(--radius-card) border p-4 text-left transition-colors disabled:opacity-50 ${
                selected
                  ? "border-accent bg-accent/5"
                  : "border-card-border bg-card hover:border-line"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {preset.recommended && (
                      <Badge tone="accent">{t("recommended")}</Badge>
                    )}
                    <span className="font-bold">{preset.title}</span>
                  </div>
                  <div className="mt-1.5 flex flex-col gap-0.5 text-[13px] text-muted">
                    {preset.lines.map((line, i) => (
                      <span key={i}>{line}</span>
                    ))}
                  </div>
                </div>
                <span
                  aria-hidden
                  className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected ? "border-accent" : "border-line"
                  }`}
                >
                  {selected && <span className="size-2.5 rounded-full bg-accent" />}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-7 text-[11px] font-semibold uppercase tracking-wide text-muted-2">
        {t("fineTuning")}
      </p>
      <div className="mt-2 rounded-(--radius-card) border border-card-border bg-card px-4 py-1">
        {FLAG_KEYS.map((key, i) => (
          <div
            key={key}
            className={`flex items-center justify-between gap-4 py-3 ${
              i > 0 ? "border-t border-card-border/60" : ""
            }`}
          >
            <span className="text-sm">{t(`toggles.${key}`)}</span>
            <Switch
              checked={flags[key]}
              onChange={(v) => setFlags((prev) => ({ ...prev, [key]: v }))}
              label={t(`toggles.${key}`)}
            />
          </div>
        ))}
      </div>

      {errorKey && (
        <div className="mt-5 flex flex-col gap-3">
          <FormAlert>{te(errorKey)}</FormAlert>
          {errorKey === "entityHasQr" && (
            <Button
              type="button"
              variant="secondary"
              onClick={onChooseAnother}
              className="w-full"
            >
              {te("chooseAnother")}
            </Button>
          )}
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={submitting}
          className="flex-1"
        >
          {tc("back")}
        </Button>
        <Button
          type="submit"
          loading={submitting}
          className="flex-[1.5]"
        >
          {tc("next")}
        </Button>
      </div>
    </form>
  );
}
