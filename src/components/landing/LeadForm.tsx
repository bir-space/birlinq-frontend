"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function LeadForm() {
  const t = useTranslations("landing.leadSection");
  const tf = useTranslations("landing.leadSection.form");

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) {
      setError(tf("required"));
      return;
    }
    setError(null);
    // TODO(backend): still nowhere to send this. The backend has exactly one
    // lead endpoint — POST /public/q/{code}/lead — and it is keyed on a scanned
    // QR code, which a landing visitor does not have. The `leads` table and the
    // Filament resource behind it are ready; what is missing is an
    // unauthenticated, throttled POST /leads with no code. Until it exists this
    // form only shows its success state.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card className="flex flex-col items-center justify-center gap-4 p-8 text-center sm:p-10">
        <span className="grid size-16 place-items-center rounded-full bg-accent/15 text-accent">
          <svg
            viewBox="0 0 24 24"
            className="size-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m5 13 5 5L19 7" />
          </svg>
        </span>
        <h3 className="text-[22px] font-bold">{tf("successTitle")}</h3>
        <p className="max-w-[320px] text-[14px] leading-relaxed text-muted">
          {tf("successText")}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label={tf("name")}
          placeholder={tf("namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
        <Input
          label={tf("contact")}
          placeholder={tf("contactPlaceholder")}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          autoComplete="tel"
        />
        <Input
          label={tf("city")}
          placeholder={tf("cityPlaceholder")}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          autoComplete="address-level2"
        />
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button type="submit" size="lg" className="mt-2 w-full">
          {tf("submit")}
        </Button>
        <p className="text-center text-[12px] leading-relaxed text-muted-2">
          {t("note")}
        </p>
      </form>
    </Card>
  );
}
