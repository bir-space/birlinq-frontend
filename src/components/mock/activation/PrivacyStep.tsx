"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/auth/FormAlert";
import { mockEntitiesApi as entitiesApi } from "@/lib/mock/mock-endpoints";
import type { Entity, PrivacySettings } from "@/lib/api/types";

export type PrivacyFlags = Pick<
  PrivacySettings,
  | "show_owner_name"
  | "show_phone"
  | "show_whatsapp"
  | "show_telegram"
  | "show_plate_number"
  | "show_vehicle_details"
>;

const FLAG_KEYS = [
  "show_owner_name",
  "show_phone",
  "show_whatsapp",
  "show_telegram",
  "show_plate_number",
  "show_vehicle_details",
] as const;

type PresetId = "safe" | "open" | "max";

const PRESETS: Record<PresetId, PrivacyFlags> = {
  safe: {
    show_owner_name: false,
    show_phone: false,
    show_whatsapp: false,
    show_telegram: false,
    show_plate_number: false,
    show_vehicle_details: true,
  },
  open: {
    show_owner_name: true,
    show_phone: true,
    show_whatsapp: true,
    show_telegram: true,
    show_plate_number: true,
    show_vehicle_details: true,
  },
  max: {
    show_owner_name: false,
    show_phone: false,
    show_whatsapp: false,
    show_telegram: false,
    show_plate_number: false,
    show_vehicle_details: false,
  },
};

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
  loadExisting,
  submitting,
  errorKey,
  onSubmit,
  onBack,
  onChooseAnother,
}: {
  entity: Entity;
  /** load current privacy from the API (when an existing entity was picked) */
  loadExisting: boolean;
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

  const [flags, setFlags] = useState<PrivacyFlags>(PRESETS.safe);
  const [loading, setLoading] = useState(loadExisting);

  useEffect(() => {
    if (!loadExisting) return;
    let cancelled = false;
    (async () => {
      try {
        const { privacy } = await entitiesApi.getPrivacy(entity.id);
        if (!cancelled) {
          setFlags({
            show_owner_name: privacy.show_owner_name,
            show_phone: privacy.show_phone,
            show_whatsapp: privacy.show_whatsapp,
            show_telegram: privacy.show_telegram,
            show_plate_number: privacy.show_plate_number,
            show_vehicle_details: privacy.show_vehicle_details,
          });
        }
      } catch {
        // fall back to the safe preset
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entity.id, loadExisting]);

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
              disabled={loading}
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
          disabled={loading}
          className="flex-[1.5]"
        >
          {tc("next")}
        </Button>
      </div>
    </form>
  );
}
