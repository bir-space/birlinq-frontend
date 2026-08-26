"use client";

import { use, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { entityLabel } from "@birlinq/api";
import { useApi, useHref } from "@/lib/app-env";
import { ApiRequestError } from "@birlinq/api";
import type { Entity, PrivacySettings, QrCode } from "@birlinq/api";
import { normalizePlate } from "@/lib/plate";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  ErrorCard,
  IconArrowLeft,
  IconBubble,
  IconCar,
  IconExternal,
  SectionLabel,
  Toggle,
} from "@/components/dashboard/bits";
import { formatRelativeTime, qrBadgeTone } from "@/components/dashboard/format";

/**
 * Car-relevant slice of App\Domain\Entity\Data\PrivacySettingsData.
 * show_phone2 / show_company / show_bio belong to `personal` entities.
 */
const PRIVACY_KEYS = [
  "show_display_name",
  "show_phone",
  "show_whatsapp",
  "show_telegram",
  "show_email",
  "show_license_plate",
  "show_year",
] as const;
type PrivacyKey = (typeof PRIVACY_KEYS)[number];

interface VehicleForm {
  title: string;
  make: string;
  model: string;
  color: string;
  year: string;
  plate: string;
}

function formFromEntity(entity: Entity): VehicleForm {
  const v = entity.vehicle_profile;
  return {
    title: entity.title ?? "",
    make: v?.make ?? "",
    model: v?.model ?? "",
    color: v?.color ?? "",
    year: v?.year != null ? String(v.year) : "",
    plate: v?.license_plate ?? "",
  };
}

export function QrDetailView({
  id,
  banner,
}: {
  id: string;
  banner?: ReactNode;
}) {
  return (
    <DashboardShell banner={banner}>
      <QrDetail id={id} />
    </DashboardShell>
  );
}

function QrDetail({ id }: { id: string }) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const api = useApi();
  const href = useHref();

  const [qr, setQr] = useState<QrCode | null>(null);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"notFound" | "generic" | null>(null);
  const [attempt, setAttempt] = useState(0);

  // vehicle edit form
  const [form, setForm] = useState<VehicleForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // privacy
  const [privacyBusy, setPrivacyBusy] = useState<PrivacyKey | null>(null);
  const [privacyError, setPrivacyError] = useState<string | null>(null);

  // pause / resume
  const [qrBusy, setQrBusy] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const { qr_code } = await api.qr.get(id);
        if (cancelled) return;
        setQr(qr_code);
        if (qr_code.entity_id) {
          // Privacy flags ride along on the entity payload — there is no
          // GET /entities/{id}/privacy endpoint.
          const { entity: ent } = await api.entities.get(qr_code.entity_id);
          if (cancelled) return;
          setEntity(ent);
          setForm(formFromEntity(ent));
          setPrivacy(ent.privacy_settings);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiRequestError && err.status === 404
              ? "notFound"
              : "generic"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const updateForm = (patch: Partial<VehicleForm>) => {
    setForm((cur) => (cur ? { ...cur, ...patch } : cur));
    setSaved(false);
    setSaveError(null);
  };

  const saveVehicle = async (e: FormEvent) => {
    e.preventDefault();
    if (!entity || !form || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      // Title lives on the entity, the rest on the vehicle profile — two
      // separate endpoints on this backend.
      await api.entities.update(entity.id, {
        title: form.title.trim() || null,
      });
      const year = Number.parseInt(form.year.trim(), 10);
      const { entity: updated } = await api.entities.upsertVehicle(entity.id, {
        make: form.make.trim(),
        model: form.model.trim(),
        color: form.color.trim(),
        year: Number.isFinite(year) ? year : null,
        license_plate: form.plate.trim() || null,
      });
      setEntity(updated);
      setForm(formFromEntity(updated));
      setPrivacy(updated.privacy_settings);
      setSaved(true);
    } catch {
      setSaveError(t("detail.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const togglePrivacy = async (key: PrivacyKey) => {
    if (!entity || !privacy || privacyBusy) return;
    const next = !privacy[key];
    setPrivacyBusy(key);
    setPrivacyError(null);
    // Optimistic flip.
    setPrivacy({ ...privacy, [key]: next });
    try {
      const { entity: updated } = await api.entities.updatePrivacy(entity.id, {
        [key]: next,
      });
      setEntity(updated);
      setPrivacy(updated.privacy_settings);
    } catch {
      setPrivacy((cur) => (cur ? { ...cur, [key]: !next } : cur));
      setPrivacyError(t("detail.privacyError"));
    } finally {
      setPrivacyBusy(null);
    }
  };

  const toggleQrStatus = async () => {
    if (!qr || qrBusy) return;
    const pausing = qr.status === "activated";
    setQrBusy(true);
    setQrError(null);
    try {
      const { qr_code } = pausing
        ? await api.qr.pause(qr.id)
        : await api.qr.resume(qr.id);
      setQr(qr_code);
    } catch {
      setQrError(t("qrList.actionError"));
    } finally {
      setQrBusy(false);
    }
  };

  if (loading) return <PageSpinner />;

  if (error || !qr) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink label={tc("back")} />
        <ErrorCard
          message={error === "notFound" ? t("detail.notFound") : tc("error")}
          retryLabel={tc("retry")}
          onRetry={
            error === "notFound" ? undefined : () => setAttempt((n) => n + 1)
          }
        />
      </div>
    );
  }

  const v = entity?.vehicle_profile;
  const vehicleDesc = v
    ? [v.color, v.make, v.model].filter(Boolean).join(" · ")
    : null;
  const canPause = qr.status === "activated";
  const canResume = qr.status === "paused";

  return (
    <div className="flex flex-col gap-6">
      <BackLink label={tc("back")} />

      {/* Header card */}
      <Card className="flex items-center gap-4">
        <IconBubble tone={qr.status === "activated" ? "accent" : "muted"}>
          <IconCar className="size-6" />
        </IconBubble>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[18px] font-bold">
            {entity ? entityLabel(entity, qr.code) : qr.code}
          </h1>
          {vehicleDesc && (
            <p className="mt-0.5 truncate text-[13px] text-muted">
              {vehicleDesc}
            </p>
          )}
          <div className="mt-2">
            <Badge tone={qrBadgeTone(qr.status)}>
              {t(`qrStatus.${qr.status}`)}
            </Badge>
          </div>
        </div>
      </Card>

      {/* QR info */}
      <section>
        <SectionLabel>{t("detail.sectionQr")}</SectionLabel>
        <Card className="flex flex-col">
          <InfoRow label={t("detail.code")}>
            <span className="font-mono tracking-wide">{qr.code}</span>
          </InfoRow>
          <InfoRow label={t("detail.activated")}>
            {qr.activated_at
              ? new Date(qr.activated_at).toLocaleDateString(locale, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "—"}
          </InfoRow>
          <InfoRow label={t("detail.lastScan")}>
            {formatRelativeTime(qr.last_scan_at, t, locale)}
          </InfoRow>
          <InfoRow label={t("detail.scanCount")}>{qr.scan_count}</InfoRow>
          <div className="mt-1 pt-3">
            <Link
              href={href(`/q/${qr.code}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent transition-colors hover:text-white"
            >
              <IconExternal />
              {t("detail.openPublic")}
            </Link>
          </div>
        </Card>
      </section>

      {/* Vehicle card */}
      {entity && form && (
        <section>
          <SectionLabel>{t("detail.sectionVehicle")}</SectionLabel>
          <Card>
            <form onSubmit={saveVehicle} className="flex flex-col gap-4">
              <Input
                label={t("detail.fields.title")}
                value={form.title}
                onChange={(e) => updateForm({ title: e.target.value })}
                maxLength={80}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label={t("detail.fields.make")}
                  value={form.make}
                  onChange={(e) => updateForm({ make: e.target.value })}
                  required
                  maxLength={40}
                />
                <Input
                  label={t("detail.fields.model")}
                  value={form.model}
                  onChange={(e) => updateForm({ model: e.target.value })}
                  required
                  maxLength={40}
                />
                <Input
                  label={t("detail.fields.color")}
                  value={form.color}
                  onChange={(e) => updateForm({ color: e.target.value })}
                  required
                  maxLength={40}
                />
                <Input
                  label={t("detail.fields.year")}
                  value={form.year}
                  onChange={(e) =>
                    updateForm({ year: e.target.value.replace(/\D/g, "") })
                  }
                  inputMode="numeric"
                  maxLength={4}
                />
                <Input
                  label={t("detail.fields.plate")}
                  value={form.plate}
                  onChange={(e) =>
                    updateForm({ plate: normalizePlate(e.target.value) })
                  }
                  autoCapitalize="characters"
                  maxLength={20}
                />
              </div>
              {saveError && (
                <p className="text-[13px] text-danger">{saveError}</p>
              )}
              <div className="flex items-center gap-3">
                <Button type="submit" size="sm" loading={saving}>
                  {tc("save")}
                </Button>
                {saved && (
                  <span className="text-[13px] font-medium text-accent">
                    {t("detail.saved")}
                  </span>
                )}
              </div>
            </form>
          </Card>
        </section>
      )}

      {/* Privacy */}
      {entity && privacy && (
        <section>
          <SectionLabel>{t("detail.sectionPrivacy")}</SectionLabel>
          <Card>
            <p className="mb-2 text-[13px] text-muted-2">
              {t("detail.privacyHint")}
            </p>
            <ul className="divide-y divide-card-border">
              {PRIVACY_KEYS.map((key) => (
                <li
                  key={key}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <span className="text-[14px]">
                    {t(`detail.privacy.${key}`)}
                  </span>
                  <Toggle
                    checked={privacy[key]}
                    disabled={privacyBusy !== null}
                    onToggle={() => togglePrivacy(key)}
                    label={t(`detail.privacy.${key}`)}
                  />
                </li>
              ))}
            </ul>
            {privacyError && (
              <p className="mt-2 text-[13px] text-danger">{privacyError}</p>
            )}
          </Card>
        </section>
      )}

      {!entity && (
        <p className="text-[13px] text-muted-2">{t("detail.noEntity")}</p>
      )}

      {/* Danger zone */}
      {(canPause || canResume) && (
        <section>
          <SectionLabel>
            <span className="text-danger">{t("detail.sectionDanger")}</span>
          </SectionLabel>
          <Card className="border-danger/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold">
                  {canPause ? t("detail.pauseTitle") : t("detail.resumeTitle")}
                </p>
                <p className="mt-0.5 text-[12px] text-muted-2">
                  {canPause ? t("detail.pauseHint") : t("detail.resumeHint")}
                </p>
              </div>
              <Button
                variant={canPause ? "danger" : "accent"}
                size="sm"
                loading={qrBusy}
                onClick={toggleQrStatus}
              >
                {canPause ? t("qrList.pause") : t("qrList.resume")}
              </Button>
            </div>
            {qrError && (
              <p className="mt-2 text-[13px] text-danger">{qrError}</p>
            )}
          </Card>
        </section>
      )}
    </div>
  );
}

function BackLink({ label }: { label: string }) {
  const href = useHref();
  return (
    <Link
      href={href("/dashboard/qr")}
      className="inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-muted transition-colors hover:text-white"
    >
      <IconArrowLeft className="size-4" />
      {label}
    </Link>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-card-border py-2.5 text-[13px] last:border-b-0">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="min-w-0 truncate text-right text-white">{children}</span>
    </div>
  );
}
