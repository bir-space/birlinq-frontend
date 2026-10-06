"use client";

import { useTranslations } from "next-intl";
import {
  LIMITS,
  SOCIAL_PLATFORMS,
  socialUrlMatchesPlatform,
  type SocialLink,
  type SocialPlatform,
} from "@birlinq/api";
import type { FieldErrors } from "@birlinq/core";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { IconTrash } from "@/components/card/icons";

export type SocialIssue = "invalidUrl" | "duplicate";

/**
 * The problems a list of links has, per row — the same rules as
 * App\Rules\SocialProfileUrl and `distinct`, so a form can refuse to save
 * before the 422. An empty URL is not an issue here: the row is simply
 * dropped on save.
 */
export function socialsIssues(
  links: readonly SocialLink[]
): Partial<Record<number, SocialIssue>> {
  const issues: Partial<Record<number, SocialIssue>> = {};
  const seen = new Set<SocialPlatform>();
  links.forEach((link, i) => {
    if (seen.has(link.platform)) {
      issues[i] = "duplicate";
    } else {
      seen.add(link.platform);
      const url = link.url.trim();
      if (url && !socialUrlMatchesPlatform(url, link.platform)) {
        issues[i] = "invalidUrl";
      }
    }
  });
  return issues;
}

/** The rows worth sending: trimmed, non-empty URLs. */
export function cleanSocials(links: readonly SocialLink[]): SocialLink[] {
  return links
    .map((l) => ({ platform: l.platform, url: l.url.trim() }))
    .filter((l) => l.url !== "");
}

/**
 * Rows of platform + URL, one platform at most once, up to `LIMITS.socialsMax`.
 * Validation messages appear inline as the owner types; `fieldErrors` from a
 * 422 (`socials.0.url`) take over for the row they name.
 */
export function SocialsEditor({
  value,
  onChange,
  disabled = false,
  fieldErrors = {},
}: {
  value: SocialLink[];
  onChange: (links: SocialLink[]) => void;
  disabled?: boolean;
  fieldErrors?: FieldErrors;
}) {
  const t = useTranslations("cards.socials");
  const tCard = useTranslations("card.socials");
  const issues = socialsIssues(value);
  const used = new Set(value.map((l) => l.platform));
  const nextFree = SOCIAL_PLATFORMS.find((p) => !used.has(p));
  const full = value.length >= LIMITS.socialsMax;

  const update = (index: number, patch: Partial<SocialLink>) =>
    onChange(value.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  const remove = (index: number) =>
    onChange(value.filter((_, i) => i !== index));

  const add = () => {
    if (!nextFree || full) return;
    onChange([...value, { platform: nextFree, url: "" }]);
  };

  return (
    <div className="flex flex-col gap-4">
      {value.length === 0 && (
        <p className="text-[13px] text-muted-2">{t("empty")}</p>
      )}

      {value.map((link, i) => {
        const issue = issues[i];
        const message = issue
          ? t(`errors.${issue}`, { platform: tCard(link.platform) })
          : fieldErrors[`socials.${i}.url`] ??
            fieldErrors[`socials.${i}.platform`] ??
            null;
        return (
          <div
            key={i}
            className="grid grid-cols-1 gap-3 rounded-(--radius-card) border border-card-border p-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] sm:items-start"
          >
            <Select
              label={t("platform")}
              value={link.platform}
              onChange={(e) =>
                update(i, { platform: e.target.value as SocialPlatform })
              }
              disabled={disabled}
            >
              {SOCIAL_PLATFORMS.map((p) => (
                <option
                  key={p}
                  value={p}
                  disabled={p !== link.platform && used.has(p)}
                >
                  {tCard(p)}
                </option>
              ))}
            </Select>
            <Input
              label={t("url")}
              placeholder={t("urlPlaceholder")}
              value={link.url}
              onChange={(e) => update(i, { url: e.target.value })}
              maxLength={LIMITS.socialUrl}
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={disabled}
              error={message}
            />
            <div className="sm:pt-[26px]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(i)}
                disabled={disabled}
                className="w-full sm:w-auto"
              >
                <IconTrash className="size-4" />
                {t("remove")}
              </Button>
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-muted-2">
          {full ? t("errors.max", { n: LIMITS.socialsMax }) : t("hint", { n: LIMITS.socialsMax })}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={add}
          disabled={disabled || full || !nextFree}
        >
          {t("add")}
        </Button>
      </div>
    </div>
  );
}
