"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { LIMITS, type Entity } from "@birlinq/api";
import { TagInput } from "@/components/forms/TagInput";
import { SaveRow, Section, useWriteError, type SectionProps } from "./shared";

function fromEntity(entity: Entity): string[] {
  return [...(entity.contact_profile?.tags ?? [])];
}

/** Skills and topics — up to ten short tags, shown publicly with `show_tags`. */
export function TagsSection({ card, entity, feedback, run }: SectionProps) {
  const t = useTranslations("cards");
  const writeError = useWriteError();
  const [tags, setTags] = useState<string[]>(() => fromEntity(entity));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!dirty) setTags(fromEntity(entity));
  }, [entity, dirty]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const ok = await run(() =>
      card.saveContact({ tags: tags.length > 0 ? tags : null })
    );
    if (ok) setDirty(false);
    setSaving(false);
  };

  const failed = feedback === "error";

  return (
    <Section
      id="tags"
      title={t("sections.tags")}
      hint={t("tags.hint", { n: LIMITS.tagsMax, len: LIMITS.tagMax })}
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TagInput
          value={tags}
          onChange={(next) => {
            setTags(next);
            setDirty(true);
          }}
          disabled={card.busy !== null}
          error={failed ? (card.fieldErrors.tags ?? null) : null}
        />
        <SaveRow
          label={t("tags.save")}
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
