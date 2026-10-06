"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { LIMITS, type ContactChannel, type Entity } from "@birlinq/api";
import { Input } from "@/components/ui/Input";
import { formatKzPhoneDisplay } from "@/components/business/phone";
import {
  SaveRow,
  Section,
  orNull,
  useWriteError,
  type SectionProps,
} from "./shared";

type ContactsForm = Record<ContactChannel, string>;

/** Field order, input type and limit of each channel. */
const FIELDS: readonly {
  key: ContactChannel;
  type: "tel" | "email" | "url" | "text";
  max: number;
  autoComplete?: string;
  /** Tidy a Kazakhstan mobile on blur. */
  phone?: boolean;
}[] = [
  { key: "phone", type: "tel", max: LIMITS.contactPhone, autoComplete: "tel", phone: true },
  { key: "phone2", type: "tel", max: LIMITS.contactPhone, phone: true },
  { key: "email", type: "email", max: LIMITS.contactEmail, autoComplete: "email" },
  { key: "whatsapp", type: "tel", max: LIMITS.contactWhatsapp, phone: true },
  { key: "telegram", type: "text", max: LIMITS.contactTelegram },
  { key: "website", type: "url", max: LIMITS.contactWebsite, autoComplete: "url" },
  { key: "linkedin", type: "url", max: LIMITS.contactLinkedin },
  { key: "instagram", type: "text", max: LIMITS.contactInstagram },
];

/** The channels that have a placeholder-style hint in the messages. */
const HINTED = new Set<ContactChannel>([
  "phone",
  "whatsapp",
  "telegram",
  "instagram",
  "linkedin",
  "website",
]);

function fromEntity(entity: Entity): ContactsForm {
  const p = entity.contact_profile;
  return {
    phone: p?.phone ?? "",
    phone2: p?.phone2 ?? "",
    email: p?.email ?? "",
    whatsapp: p?.whatsapp ?? "",
    telegram: p?.telegram ?? "",
    website: p?.website ?? "",
    linkedin: p?.linkedin ?? "",
    instagram: p?.instagram ?? "",
  };
}

/** The eight tappable channels of the card. Each shows publicly only with its privacy switch on. */
export function ContactsSection({ card, entity, feedback, run }: SectionProps) {
  const t = useTranslations("cards");
  const writeError = useWriteError();
  const [form, setForm] = useState<ContactsForm>(() => fromEntity(entity));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!dirty) setForm(fromEntity(entity));
  }, [entity, dirty]);

  const update = (key: ContactChannel, value: string) => {
    setForm((cur) => ({ ...cur, [key]: value }));
    setDirty(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const ok = await run(() =>
      card.saveContact({
        phone: orNull(form.phone),
        phone2: orNull(form.phone2),
        email: orNull(form.email),
        whatsapp: orNull(form.whatsapp),
        telegram: orNull(form.telegram.replace(/^@/, "")),
        website: orNull(form.website),
        linkedin: orNull(form.linkedin),
        instagram: orNull(form.instagram.replace(/^@/, "")),
      })
    );
    if (ok) setDirty(false);
    setSaving(false);
  };

  const failed = feedback === "error";

  return (
    <Section
      id="contacts"
      title={t("sections.contacts")}
      hint={t("contacts.hint")}
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <Input
              key={field.key}
              label={t(`contacts.fields.${field.key}`)}
              type={field.type}
              inputMode={field.type === "tel" ? "tel" : undefined}
              autoComplete={field.autoComplete}
              autoCapitalize={field.type === "text" ? "off" : undefined}
              spellCheck={false}
              value={form[field.key]}
              onChange={(e) => update(field.key, e.target.value)}
              onBlur={
                field.phone
                  ? (e) => {
                      const tidy = formatKzPhoneDisplay(e.target.value);
                      if (tidy !== e.target.value) update(field.key, tidy);
                    }
                  : undefined
              }
              maxLength={field.max}
              hint={HINTED.has(field.key) ? t(`contacts.hints.${field.key}`) : undefined}
              error={failed ? (card.fieldErrors[field.key] ?? null) : null}
            />
          ))}
        </div>
        <SaveRow
          label={t("contacts.save")}
          loading={saving}
          disabled={card.busy !== null && !saving}
          feedback={dirty ? null : feedback}
          savedMessage={t("edit.saved")}
          errorMessage={failed ? writeError(card.actionError) : null}
        />
      </form>
    </Section>
  );
}
