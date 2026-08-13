"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useApi } from "@/lib/app-env";
import { ApiRequestError } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconCheck } from "./icons";

/**
 * "I want such a sticker" lead form — name + contact required, city optional.
 * Renders its own success state after api.public.submitLead resolves.
 */
export function LeadForm({ code }: { code: string }) {
  const t = useTranslations("public");
  const api = useApi();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [city, setCity] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    contact?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof fieldErrors = {};
    if (!name.trim()) next.name = t("lead.required");
    if (!contact.trim()) next.contact = t("lead.required");
    setFieldErrors(next);
    if (next.name || next.contact) return;

    setSubmitting(true);
    setError(null);
    try {
      await api.public.submitLead(code, {
        name: name.trim(),
        contact: contact.trim(),
        ...(city.trim() ? { city: city.trim() } : {}),
      });
      setDone(true);
    } catch (err) {
      if (
        err instanceof ApiRequestError &&
        (err.status === 429 || err.code === "RATE_LIMITED")
      ) {
        setError(t("scenario.rateLimited"));
      } else {
        setError(t("errors.genericText"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-(--radius-btn) border border-accent/25 bg-accent/10 p-4">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-ink-900">
          <IconCheck className="size-3.5" strokeWidth={2.4} />
        </span>
        <div>
          <p className="text-[14px] font-semibold text-accent">
            {t("lead.successTitle")}
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            {t("lead.successText")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <Input
        label={t("lead.nameLabel")}
        placeholder={t("lead.namePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={fieldErrors.name ?? null}
        autoComplete="name"
        name="name"
      />
      <Input
        label={t("lead.contactLabel")}
        placeholder={t("lead.contactPlaceholder")}
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        error={fieldErrors.contact ?? null}
        autoComplete="tel"
        name="contact"
        inputMode="tel"
      />
      <Input
        label={t("lead.cityLabel")}
        placeholder={t("lead.cityPlaceholder")}
        value={city}
        onChange={(e) => setCity(e.target.value)}
        autoComplete="address-level2"
        name="city"
      />
      {error && <p className="text-[12px] text-danger">{error}</p>}
      <Button
        type="submit"
        className="mt-1 w-full"
        loading={submitting}
      >
        {t("lead.submit")}
      </Button>
    </form>
  );
}
