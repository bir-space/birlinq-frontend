"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { LIMITS, type Entity } from "@birlinq/api";
import { Input, Textarea } from "@/components/ui/Input";
import { todayYmd } from "@/components/business/dates";
import {
  SaveRow,
  Section,
  orNull,
  useWriteError,
  type SectionProps,
} from "./shared";

interface ProfileForm {
  displayName: string;
  title: string;
  company: string;
  bio: string;
  birthday: string;
}

function fromEntity(entity: Entity): ProfileForm {
  const p = entity.contact_profile;
  return {
    displayName: p?.display_name ?? "",
    title: p?.title ?? "",
    company: p?.company ?? "",
    bio: p?.bio ?? "",
    birthday: p?.date_of_birth ?? "",
  };
}

/** Who the owner is: name, title, company, bio and the birthday. */
export function ProfileSection({ card, entity, feedback, run }: SectionProps) {
  const t = useTranslations("cards");
  const writeError = useWriteError();
  const [form, setForm] = useState<ProfileForm>(() => fromEntity(entity));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Follow the entity while untouched; an edited form is never overwritten
  // by another section's save.
  useEffect(() => {
    if (!dirty) setForm(fromEntity(entity));
  }, [entity, dirty]);

  const update = (patch: Partial<ProfileForm>) => {
    setForm((cur) => ({ ...cur, ...patch }));
    setDirty(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const ok = await run(() =>
      card.saveContact({
        display_name: orNull(form.displayName),
        title: orNull(form.title),
        company: orNull(form.company),
        bio: orNull(form.bio),
        date_of_birth: orNull(form.birthday),
      })
    );
    if (ok) setDirty(false);
    setSaving(false);
  };

  const failed = feedback === "error";
  const fieldError = (key: string) =>
    failed ? (card.fieldErrors[key] ?? null) : null;

  return (
    <Section id="profile" title={t("sections.profile")} hint={t("profile.hint")}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Input
          label={t("profile.fields.displayName")}
          value={form.displayName}
          onChange={(e) => update({ displayName: e.target.value })}
          maxLength={LIMITS.contactDisplayName}
          autoComplete="name"
          error={fieldError("display_name")}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t("profile.fields.title")}
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            maxLength={LIMITS.contactTitle}
            autoComplete="organization-title"
            error={fieldError("title")}
          />
          <Input
            label={t("profile.fields.company")}
            value={form.company}
            onChange={(e) => update({ company: e.target.value })}
            maxLength={LIMITS.contactCompany}
            autoComplete="organization"
            error={fieldError("company")}
          />
        </div>
        <Textarea
          label={t("profile.fields.bio")}
          placeholder={t("profile.fields.bioPlaceholder")}
          value={form.bio}
          onChange={(e) => update({ bio: e.target.value })}
          maxLength={LIMITS.contactBio}
          error={fieldError("bio")}
        />
        <Input
          label={t("profile.fields.birthday")}
          type="date"
          value={form.birthday}
          onChange={(e) => update({ birthday: e.target.value })}
          max={todayYmd()}
          hint={t("profile.fields.birthdayHint")}
          error={fieldError("date_of_birth")}
          className="sm:max-w-xs"
        />
        <SaveRow
          label={t("profile.save")}
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
