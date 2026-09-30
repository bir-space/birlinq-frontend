"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cardUrl } from "@/lib/public-url";
import { copyText } from "@/lib/share";
import { Button } from "@/components/ui/Button";
import { IconCopy } from "@/components/card/icons";
import { IconExternal } from "@/components/dashboard/bits";
import { Section, type SectionProps } from "./shared";

const COPIED_MS = 2200;

/**
 * The public link `/p/{alias}`, read-only. The server assigns the address
 * and it never changes (D-044): it is printed on paper, so there is nothing
 * here to edit, close or regenerate — only to copy and open. Hiding the card
 * is the publish switch's job. Any shape is shown as it is: an address from
 * before D-044 keeps its older, longer form. A card with no address yet — an
 * old row the backend's backfill has not reached — says so instead of
 * showing a link that leads nowhere.
 */
export function AliasSection({ entity }: SectionProps) {
  const t = useTranslations("cards.alias");
  const tSections = useTranslations("cards.sections");
  // Built on the client only — `appOrigin()` is empty on the server.
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setUrl(entity.alias ? cardUrl(entity.alias) : null);
  }, [entity.alias]);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    []
  );

  const copy = async () => {
    if (!url) return;
    const ok = await copyText(url);
    if (!ok) return;
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <Section id="alias" title={tSections("alias")} hint={t("hint")}>
      {entity.alias ? (
        <div className="rounded-(--radius-btn) border border-card-border bg-ink-soft px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-2">
            {t("current")}
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 break-all font-mono text-[13px] text-accent underline-offset-2 hover:underline"
              >
                {url}
              </a>
            ) : (
              <span className="min-w-0 break-all font-mono text-[13px] text-muted-2">
                /p/{entity.alias}
              </span>
            )}
            <span className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copy}
                disabled={!url}
                className="-my-1"
              >
                <IconCopy className="size-4" />
                {copied ? t("copied") : t("copy")}
              </Button>
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="-my-1 inline-flex h-9 items-center gap-1.5 rounded-(--radius-btn) px-3 text-[13px] font-semibold text-muted transition-colors hover:text-white"
                >
                  <IconExternal />
                  {t("open")}
                </a>
              )}
            </span>
          </div>
        </div>
      ) : (
        <AliasPending />
      )}
      <p className="text-[12px] text-muted-2">{t("permanent")}</p>
    </Section>
  );
}

/** A card whose address has not been assigned yet — shared with the QR section. */
export function AliasPending() {
  const t = useTranslations("cards.alias");
  return (
    <p
      role="status"
      className="rounded-(--radius-btn) border border-warn/30 bg-warn/10 px-4 py-3 text-[13px] text-warn"
    >
      {t("pending")}
    </p>
  );
}
