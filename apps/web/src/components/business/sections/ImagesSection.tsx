"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ContactImageKind } from "@birlinq/api";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { imageSrc } from "@/components/card/hrefs";
import { Section, type SectionProps } from "./shared";

type Failure = { kind: ContactImageKind; action: "upload" | "remove" };

/**
 * Photo and cover. Each control is its own write, so there is no save
 * button here: the outcome shows under the control that was used.
 */
export function ImagesSection({ card, entity, feedback, run }: SectionProps) {
  const t = useTranslations("cards");
  const [failure, setFailure] = useState<Failure | null>(null);
  const profile = entity.contact_profile;

  const attempt = async (failing: Failure, write: () => Promise<boolean>) => {
    setFailure(null);
    const ok = await run(write);
    if (!ok) setFailure(failing);
    return ok;
  };

  const errorFor = (kind: ContactImageKind): string | null => {
    if (feedback !== "error" || failure?.kind !== kind) return null;
    if (card.actionError === "blocked") return t("edit.blocked");
    if (card.actionError === "rateLimited") return t("edit.rateLimited");
    // A 422 on the upload names the `file` field.
    return card.fieldErrors.file ?? t(`images.errors.${failure.action}`);
  };

  const control = (kind: ContactImageKind) => (
    <ImageUpload
      kind={kind}
      label={t(`images.${kind}`)}
      src={imageSrc(kind === "photo" ? profile?.photo_url : profile?.cover_url)}
      busy={card.busy === kind}
      onUpload={(file, filename) =>
        attempt({ kind, action: "upload" }, () =>
          card.uploadImage(kind, file, filename)
        )
      }
      onRemove={() =>
        attempt({ kind, action: "remove" }, () => card.removeImage(kind))
      }
      error={errorFor(kind)}
    />
  );

  return (
    <Section id="images" title={t("sections.images")}>
      <div className="flex flex-col gap-6">
        {control("photo")}
        {control("cover")}
      </div>
    </Section>
  );
}
