"use client";

import { useTranslations } from "next-intl";
import { CARD_THEMES, type CardTheme } from "@birlinq/api";
import { Avatar } from "@/components/card/Avatar";
import { THEMES, headGradient, themeStyle } from "@/components/card/themes";

/**
 * The card's header in one theme, for the picker's live preview. It shows
 * a name, a title and a company — always, from props or placeholders —
 * because a preview is not a PrivacyFilter: it never pretends to know what
 * the public page will hide.
 */
export function CardHeaderPreview({
  theme,
  name,
  title,
  company,
  photoUrl = null,
  className = "",
}: {
  theme: CardTheme;
  name?: string;
  title?: string;
  company?: string;
  /** Already passed through `imageSrc`. */
  photoUrl?: string | null;
  className?: string;
}) {
  const t = useTranslations("cards.theme");
  const palette = THEMES[theme];
  const shownName = name?.trim() || t("previewName");
  const line = [title?.trim(), company?.trim()].filter(Boolean).join(" · ");

  return (
    <div
      data-scheme={palette.scheme}
      style={themeStyle(theme)}
      className={`overflow-hidden rounded-(--radius-card) border border-(--card-border) bg-(--card-bg) text-(--card-text) ${className}`}
    >
      <div
        className="h-16"
        style={{ backgroundImage: headGradient(theme) }}
        aria-hidden="true"
      />
      <div className="-mt-8 flex items-end gap-3 px-4 pb-4">
        <Avatar
          name={shownName}
          src={photoUrl}
          size="lg"
          className="border-4 border-(--card-bg) bg-(--card-surface) text-(--card-text)"
        />
        <div className="min-w-0 flex-1 pb-1">
          <p className="truncate text-[16px] font-bold">{shownName}</p>
          <p className="truncate text-[12px] text-(--card-muted)">
            {line || t("previewTitle")}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Ten swatches as a radio group plus the header preview. Swatches show the
 * theme's background and header gradient, so the choice reads at a glance
 * without opening the card.
 */
export function ThemePicker({
  value,
  onChange,
  disabled = false,
  preview,
}: {
  value: CardTheme;
  onChange: (theme: CardTheme) => void;
  disabled?: boolean;
  preview?: {
    name?: string;
    title?: string;
    company?: string;
    photoUrl?: string | null;
  };
}) {
  const t = useTranslations("card.themes");
  const tc = useTranslations("cards.theme");

  return (
    <div className="flex flex-col gap-4">
      <div
        role="radiogroup"
        aria-label={tc("hint")}
        className="grid grid-cols-5 gap-2 sm:grid-cols-10"
      >
        {CARD_THEMES.map((theme) => {
          const palette = THEMES[theme];
          const selected = theme === value;
          return (
            <button
              key={theme}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={t(theme)}
              title={t(theme)}
              disabled={disabled}
              onClick={() => onChange(theme)}
              className={`group flex cursor-pointer flex-col items-center gap-1.5 rounded-(--radius-btn) p-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${
                selected ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <span
                className={`flex size-11 items-center justify-center overflow-hidden rounded-full border-2 ${
                  selected ? "border-accent" : "border-card-border"
                }`}
                style={{ backgroundColor: palette.bg }}
              >
                <span
                  className="size-6 rounded-full"
                  style={{ backgroundImage: headGradient(theme) }}
                />
              </span>
              <span
                className={`w-full truncate text-center text-[10px] font-medium ${
                  selected ? "text-white" : "text-muted-2"
                }`}
              >
                {t(theme)}
              </span>
            </button>
          );
        })}
      </div>

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-2">
          {tc("preview")}
        </p>
        <CardHeaderPreview theme={value} {...preview} />
      </div>
    </div>
  );
}
