"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CardTheme } from "@birlinq/api";
import { useHref } from "@birlinq/platform";
import { ThemePicker } from "@/components/forms/ThemePicker";
import { imageSrc } from "@/components/card/hrefs";
import { IconExternal } from "@/components/dashboard/bits";
import { SaveRow, Section, useWriteError, type SectionProps } from "./shared";

/**
 * The look of the public card. The picker previews the header with the
 * card's own name and title; "open with this theme" shows the real page
 * under `?theme=` before the choice is saved.
 */
export function ThemeSection({ card, entity, feedback, run }: SectionProps) {
  const t = useTranslations("cards");
  const href = useHref();
  const writeError = useWriteError();
  const saved: CardTheme = entity.contact_profile?.theme ?? "default";
  const [theme, setTheme] = useState<CardTheme>(saved);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const profile = entity.contact_profile;

  useEffect(() => {
    if (!dirty) setTheme(saved);
  }, [saved, dirty]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const ok = await run(() => card.saveContact({ theme }));
    if (ok) setDirty(false);
    setSaving(false);
  };

  const failed = feedback === "error";

  return (
    <Section id="theme" title={t("sections.theme")} hint={t("theme.hint")}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <ThemePicker
          value={theme}
          onChange={(next) => {
            setTheme(next);
            setDirty(true);
          }}
          disabled={card.busy !== null}
          preview={{
            name: profile?.display_name ?? undefined,
            title: profile?.title ?? undefined,
            company: profile?.company ?? undefined,
            photoUrl: imageSrc(profile?.photo_url),
          }}
        />
        {entity.alias && (
          <Link
            href={href(`/p/${entity.alias}?theme=${theme}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-accent transition-colors hover:text-white"
          >
            <IconExternal />
            {t("theme.previewOpen")}
          </Link>
        )}
        <SaveRow
          label={t("theme.save")}
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
