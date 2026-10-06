"use client";

import { useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { LIMITS } from "@birlinq/api";
import { Button } from "@/components/ui/Button";
import { IconClose } from "@/components/public/icons";

type Issue = "max" | "tooLong" | "duplicate" | null;

/*
 * The field skin of `ui/Input.tsx`, repeated because that file's API is
 * frozen and a tag field needs the input bare (no label/hint wrapper).
 */
const fieldCls =
  "w-full rounded-(--radius-btn) bg-card border border-card-border px-4 text-[15px] text-white placeholder:text-muted-2 focus:border-accent focus:outline-none transition-colors";

/**
 * Chips plus an input: Enter or a comma adds, backspace on an empty input
 * removes the last one. Duplicates (ignoring case) and overlong tags are
 * refused with an inline message — the same rules the backend enforces.
 */
export function TagInput({
  value,
  onChange,
  disabled = false,
  max = LIMITS.tagsMax,
  maxLength = LIMITS.tagMax,
  error = null,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  max?: number;
  maxLength?: number;
  /** A server message for the whole list, shown when there is no local issue. */
  error?: string | null;
}) {
  const t = useTranslations("cards.tags");
  const [draft, setDraft] = useState("");
  const [issue, setIssue] = useState<Issue>(null);

  const full = value.length >= max;

  const add = () => {
    const tag = draft.trim().replace(/\s+/g, " ");
    if (!tag) return;
    if (full) {
      setIssue("max");
      return;
    }
    if (tag.length > maxLength) {
      setIssue("tooLong");
      return;
    }
    if (value.some((v) => v.toLowerCase() === tag.toLowerCase())) {
      setIssue("duplicate");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
    setIssue(null);
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    setIssue(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      e.preventDefault();
      remove(value.length - 1);
    }
  };

  const message = issue
    ? t(`errors.${issue}`, { n: max, len: maxLength })
    : error;

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((tag, i) => (
            <li
              key={tag}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-card-border bg-ink-soft py-1 pl-3 pr-1.5 text-[13px] font-medium text-white"
            >
              <span className="truncate">{tag}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={disabled}
                aria-label={t("remove", { tag })}
                className="flex size-5 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed"
              >
                <IconClose className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (issue) setIssue(null);
          }}
          onKeyDown={onKeyDown}
          onBlur={add}
          placeholder={full ? "" : t("placeholder")}
          aria-label={t("label")}
          maxLength={maxLength + 10}
          disabled={disabled || full}
          aria-invalid={Boolean(message)}
          enterKeyHint="done"
          autoCapitalize="off"
          className={`${fieldCls} h-[50px] ${message ? "border-danger" : ""}`}
        />
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          onClick={add}
          disabled={disabled || full || draft.trim() === ""}
        >
          {t("add")}
        </Button>
      </div>
      {message ? (
        <p className="text-[12px] text-danger">{message}</p>
      ) : (
        <p className="text-[12px] text-muted-2">
          {t("hint", { n: max, len: maxLength })}
          {" · "}
          {value.length}/{max}
        </p>
      )}
    </div>
  );
}
