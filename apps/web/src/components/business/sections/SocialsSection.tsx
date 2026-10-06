"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { LIMITS, type Entity, type SocialLink } from "@birlinq/api";
import {
  SocialsEditor,
  cleanSocials,
  socialsIssues,
} from "@/components/forms/SocialsEditor";
import { SaveRow, Section, useWriteError, type SectionProps } from "./shared";

function fromEntity(entity: Entity): SocialLink[] {
  return (entity.contact_profile?.socials ?? []).map((l) => ({ ...l }));
}

/** The extra networks — up to eight links, one per platform, https on the platform's host. */
export function SocialsSection({ card, entity, feedback, run }: SectionProps) {
  const t = useTranslations("cards");
  const writeError = useWriteError();
  const [links, setLinks] = useState<SocialLink[]>(() => fromEntity(entity));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!dirty) setLinks(fromEntity(entity));
  }, [entity, dirty]);

  const blocked = Object.keys(socialsIssues(links)).length > 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving || blocked) return;
    setSaving(true);
    const clean = cleanSocials(links);
    // An empty list is sent as null: the backend treats [] as hidden anyway,
    // and null is what a cleared field looks like everywhere else on PUT.
    const ok = await run(() =>
      card.saveContact({ socials: clean.length > 0 ? clean : null })
    );
    if (ok) setDirty(false);
    setSaving(false);
  };

  const failed = feedback === "error";

  return (
    <Section
      id="socials"
      title={t("sections.socials")}
      hint={t("socials.hint", { n: LIMITS.socialsMax })}
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <SocialsEditor
          value={links}
          onChange={(next) => {
            setLinks(next);
            setDirty(true);
          }}
          disabled={card.busy !== null}
          fieldErrors={failed ? card.fieldErrors : {}}
        />
        <SaveRow
          label={t("socials.save")}
          loading={saving}
          disabled={blocked || (card.busy !== null && !saving)}
          feedback={dirty ? null : feedback}
          savedMessage={t("edit.saved")}
          errorMessage={failed ? writeError(card.actionError) : null}
        />
      </form>
    </Section>
  );
}
