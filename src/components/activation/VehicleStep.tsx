"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { FormAlert } from "@/components/auth/FormAlert";
import { detailsToFieldErrors } from "@/components/auth/helpers";
import { useApi } from "@/lib/app-env";
import { ApiRequestError, isValidationError } from "@/lib/api/client";
import type { Entity } from "@/lib/api/types";

const COLOR_KEYS = [
  "white",
  "black",
  "gray",
  "silver",
  "red",
  "blue",
  "green",
] as const;
type ColorKey = (typeof COLOR_KEYS)[number];

const SWATCHES: Record<ColorKey, string> = {
  white: "#f8fafc",
  black: "#0d1117",
  gray: "#6b7280",
  silver: "#c3cad4",
  red: "#e3312d",
  blue: "#1f4e79",
  green: "#44d07b",
};

interface FormState {
  make?: string;
  model?: string;
  color?: string;
  plate?: string;
  form?: string;
}

/** A3 — vehicle setup: create a new vehicle or pick an existing one without a QR. */
export function VehicleStep({
  onDone,
  onBack,
}: {
  onDone: (entity: Entity) => void;
  onBack: () => void;
}) {
  const t = useTranslations("activation.vehicle");
  const tc = useTranslations("common");
  const api = useApi();

  // null = loading
  const [available, setAvailable] = useState<Entity[] | null>(null);
  const [mode, setMode] = useState<"pick" | "create">("create");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [colorKey, setColorKey] = useState<ColorKey | "other" | null>(null);
  const [customColor, setCustomColor] = useState("");
  const [plate, setPlate] = useState("");
  const [errors, setErrors] = useState<FormState>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Both endpoints are cursor-paginated with a fixed server-side page
        // size of 20, so walk every page before deciding what is free.
        const [entities, qrs] = await Promise.all([
          api.entities.listAll(),
          api.qr.listAll(),
        ]);
        if (cancelled) return;
        const taken = new Set(
          qrs
            .filter(
              (q) =>
                q.entity_id !== null &&
                (q.status === "activated" || q.status === "paused")
            )
            .map((q) => q.entity_id)
        );
        const free = entities.filter(
          (e) =>
            e.type === "car" && e.status === "active" && !taken.has(e.id)
        );
        setAvailable(free);
        if (free.length > 0) {
          setMode("pick");
          setSelectedId(free[0].id);
        }
      } catch {
        if (!cancelled) setAvailable([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (available === null) return <PageSpinner />;

  const resolvedColor =
    colorKey === "other"
      ? customColor.trim()
      : colorKey
        ? t(`colors.${colorKey}`)
        : "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (mode === "pick") {
      const entity = available?.find((en) => en.id === selectedId);
      if (entity) onDone(entity);
      return;
    }

    const nextErrors: FormState = {};
    if (!make.trim()) nextErrors.make = t("makeRequired");
    if (!model.trim()) nextErrors.model = t("modelRequired");
    if (!resolvedColor) nextErrors.color = t("colorRequired");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      // POST /entities only accepts { type, title } — the vehicle profile is
      // attached through PUT /entities/{id}/vehicle (both done by createVehicle).
      const entity = await api.entities.createVehicle({
        make: make.trim(),
        model: model.trim(),
        color: resolvedColor,
        ...(plate.trim() ? { license_plate: plate.trim() } : {}),
      });
      onDone(entity);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (isValidationError(err)) {
          const fe = detailsToFieldErrors(err.details);
          setErrors({
            make: fe.make,
            model: fe.model,
            color: fe.color,
            plate: fe.license_plate,
            form:
              !fe.make && !fe.model && !fe.color && !fe.license_plate
                ? t("createError")
                : undefined,
          });
        } else {
          setErrors({ form: err.message || t("createError") });
        }
      } else {
        setErrors({ form: t("createError") });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pt-2" noValidate>
      {mode === "pick" ? (
        <>
          <h1 className="text-2xl font-bold">{t("existingTitle")}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            {t("existingSubtitle")}
          </p>

          <div className="mt-6 flex flex-col gap-3" role="radiogroup">
            {available.map((entity) => {
              const selected = entity.id === selectedId;
              const v = entity.vehicle_profile;
              return (
                <button
                  key={entity.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setSelectedId(entity.id)}
                  className={`w-full cursor-pointer rounded-(--radius-card) border p-4 text-left transition-colors ${
                    selected
                      ? "border-accent bg-accent/5"
                      : "border-card-border bg-card hover:border-line"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {entity.title ?? (v ? `${v.make} ${v.model}` : "—")}
                      </p>
                      {v && (
                        <p className="mt-0.5 text-[13px] text-muted">
                          {v.make} {v.model} · {v.color}
                          {v.license_plate ? ` · ${v.license_plate}` : ""}
                        </p>
                      )}
                    </div>
                    <span
                      aria-hidden
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected ? "border-accent" : "border-line"
                      }`}
                    >
                      {selected && (
                        <span className="size-2.5 rounded-full bg-accent" />
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setMode("create")}
            className="mt-4 cursor-pointer text-sm font-semibold text-white underline-offset-4 hover:underline"
          >
            + {t("addNew")}
          </button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            {t("subtitle")}
          </p>

          {available.length > 0 && (
            <button
              type="button"
              onClick={() => setMode("pick")}
              className="mt-3 cursor-pointer text-sm font-semibold text-white underline-offset-4 hover:underline"
            >
              {t("chooseExisting")}
            </button>
          )}

          <div className="mt-6 flex flex-col gap-4">
            <Input
              label={t("make")}
              placeholder={t("makePlaceholder")}
              value={make}
              onChange={(e) => setMake(e.target.value)}
              error={errors.make}
              autoComplete="off"
            />
            <Input
              label={t("model")}
              placeholder={t("modelPlaceholder")}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              error={errors.model}
              autoComplete="off"
            />

            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-muted">
                {t("color")}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                {COLOR_KEYS.map((key) => {
                  const selected = colorKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-label={t(`colors.${key}`)}
                      aria-pressed={selected}
                      onClick={() => setColorKey(key)}
                      style={{ backgroundColor: SWATCHES[key] }}
                      className={`size-9 cursor-pointer rounded-full border border-line transition-shadow ${
                        selected
                          ? "ring-2 ring-accent ring-offset-2 ring-offset-ink"
                          : ""
                      }`}
                    />
                  );
                })}
                <button
                  type="button"
                  aria-label={t("colorOther")}
                  aria-pressed={colorKey === "other"}
                  onClick={() => setColorKey("other")}
                  className={`flex size-9 cursor-pointer items-center justify-center rounded-full border border-dashed border-line text-muted transition-shadow ${
                    colorKey === "other"
                      ? "ring-2 ring-accent ring-offset-2 ring-offset-ink"
                      : ""
                  }`}
                >
                  …
                </button>
              </div>
              {colorKey === "other" && (
                <div className="mt-2">
                  <Input
                    placeholder={t("colorOtherPlaceholder")}
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              )}
              {errors.color && (
                <p className="text-[12px] text-danger">{errors.color}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-medium text-muted">
                  {t("plate")}
                </span>
                <span className="text-[12px] text-muted-2">
                  {t("plateOptional")}
                </span>
              </div>
              <Input
                placeholder={t("platePlaceholder")}
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                error={errors.plate}
                autoComplete="off"
              />
            </div>

            <div className="flex items-start gap-3 rounded-(--radius-btn) border border-card-border bg-card px-4 py-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 3l7 3v5c0 4.5-3 8.4-7 10-4-1.6-7-5.5-7-10V6l7-3z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <div className="text-[12px] leading-snug">
                <p className="font-semibold text-white">
                  {t("plateBannerTitle")}
                </p>
                <p className="mt-0.5 text-muted">{t("plateBannerText")}</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 rounded-(--radius-card) border border-dashed border-line px-4 py-6 text-muted-2">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 8a1 1 0 011-1h2l1.5-2h7L17 7h2a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V8z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              <p className="text-[12px]">{t("photoHint")}</p>
            </div>
          </div>
        </>
      )}

      {errors.form && (
        <div className="mt-4">
          <FormAlert>{errors.form}</FormAlert>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          className="flex-1"
        >
          {tc("back")}
        </Button>
        <Button
          type="submit"
          loading={submitting}
          disabled={mode === "pick" && !selectedId}
          className="flex-[1.5]"
        >
          {tc("next")}
        </Button>
      </div>
    </form>
  );
}
