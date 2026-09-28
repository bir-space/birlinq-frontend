"use client";

import { useTranslations } from "next-intl";
import {
  ALIAS_RE,
  LIMITS,
  isReservedAlias,
  normalizeAlias,
} from "@birlinq/api";
import { Input } from "@/components/ui/Input";

export type AliasIssue = "short" | "invalid" | "reserved" | null;

/**
 * What is wrong with a (normalised) alias before the server sees it. Empty
 * is not an issue — on create it means "generate one for me"; the caller
 * decides whether empty is allowed. Availability is deliberately not
 * checked: there is no lookup endpoint, and a 409 after save is the answer.
 */
export function aliasIssue(alias: string): AliasIssue {
  if (alias === "") return null;
  if (alias.length < LIMITS.aliasMin) return "short";
  if (!ALIAS_RE.test(alias)) return "invalid";
  if (isReservedAlias(alias)) return "reserved";
  return null;
}

/**
 * The `/p/…` slug field. Whatever is typed or pasted is normalised on the
 * way in (lower-case, spaces to dashes, the rest dropped), so the value the
 * parent holds is always what the server would store — or a clear local
 * message about why it will not.
 */
export function AliasInput({
  value,
  onChange,
  label,
  placeholder,
  hint,
  error = null,
  disabled = false,
  autoFocus = false,
}: {
  value: string;
  onChange: (alias: string) => void;
  label?: string;
  placeholder?: string;
  /** Shown when there is no message; defaults to the format rule. */
  hint?: string;
  /** A server message (taken, blocked…); overrides the local issue. */
  error?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const t = useTranslations("cards.alias");
  const issue = aliasIssue(value);
  const message =
    error ?? (issue ? t(`errors.${issue}`, { n: LIMITS.aliasMin }) : null);

  return (
    <div className="flex items-start gap-2">
      <span
        aria-hidden="true"
        className={`flex h-[50px] shrink-0 items-center font-mono text-[15px] text-muted-2 ${
          label ? "mt-[26px]" : ""
        }`}
      >
        {t("prefix")}
      </span>
      <div className="min-w-0 flex-1">
        <Input
          label={label ?? t("label")}
          placeholder={placeholder ?? t("placeholder")}
          value={value}
          onChange={(e) => onChange(normalizeAlias(e.target.value))}
          maxLength={LIMITS.alias}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          disabled={disabled}
          error={message}
          hint={hint ?? t("rules")}
          className="font-mono"
        />
      </div>
    </div>
  );
}
