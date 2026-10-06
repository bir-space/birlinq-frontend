"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LIMITS, type QrCode } from "@birlinq/api";
import { useHref } from "@birlinq/platform";
import { cardUrl } from "@/lib/public-url";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { QrPanel } from "@/components/card/QrPanel";
import {
  IconBubble,
  IconChevronRight,
  IconQr,
} from "@/components/dashboard/bits";
import { qrBadgeTone } from "@/components/dashboard/format";
import { AliasPending } from "./AliasSection";
import { Section, type SectionProps } from "./shared";

/**
 * The card's QR — the code of its permanent public link (D-044) — and the
 * physical stickers bound to it. A sticker is attached with the code and
 * token printed on its back: the hook looks it up, then activates it onto
 * this card.
 */
export function QrSection({ card, entity, feedback, run }: SectionProps) {
  const t = useTranslations("cards.qr");
  const tSections = useTranslations("cards.sections");
  const tCard = useTranslations("card");
  const td = useTranslations("dashboard");
  const href = useHref();
  // Built after mount: `appOrigin()` has no value during SSR.
  const [url, setUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [attaching, setAttaching] = useState(false);
  const [attached, setAttached] = useState<string | null>(null);

  useEffect(() => {
    setUrl(entity.alias ? cardUrl(entity.alias) : null);
  }, [entity.alias]);

  const name =
    entity.contact_profile?.display_name?.trim() || tCard("fallbackName");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (attaching || !code.trim() || !token.trim()) return;
    setAttaching(true);
    setAttached(null);
    // A property rather than a `let`: TypeScript does not see an assignment
    // made inside the closure and would narrow a plain variable to null.
    const outcome: { qr: QrCode | null } = { qr: null };
    const ok = await run(async () => {
      outcome.qr = await card.attachSticker(code, token);
      return outcome.qr !== null;
    });
    if (ok && outcome.qr) {
      setAttached(outcome.qr.code);
      setCode("");
      setToken("");
    }
    setAttaching(false);
  };

  const attachFailed = feedback === "error";
  const fieldError = (key: string) =>
    attachFailed ? (card.fieldErrors[key] ?? null) : null;
  const attachError = (() => {
    if (!attachFailed) return null;
    switch (card.actionError) {
      case "qrNotFound":
        return t("attach.errors.notFound");
      case "qrTaken":
        return t("attach.errors.taken");
      case "entityHasQr":
        return t("attach.errors.entityHasQr");
      case "rateLimited":
        return t("attach.errors.rateLimited");
      case "validation":
        // The inputs carry the field messages; nothing more to say.
        return card.fieldErrors.code || card.fieldErrors.activation_token
          ? null
          : t("attach.errors.generic");
      default:
        return t("attach.errors.generic");
    }
  })();

  return (
    <Section id="qr" title={tSections("qr")} hint={t("hint")}>
      {!entity.alias ? (
        // No address yet, so nothing to encode (see `AliasSection`).
        <AliasPending />
      ) : (
        url && (
          <QrPanel
            url={url}
            filename={`birlinq-${entity.alias}.png`}
            alt={tCard("qrPage.subtitle", { name })}
            shareTitle={tCard("share.title", { name })}
            shareText={tCard("share.text", { name })}
            hint={t("print")}
          />
        )
      )}

      <div className="border-t border-card-border pt-4">
        <p className="text-[14px] font-semibold">{t("stickersTitle")}</p>
        <p className="mt-0.5 text-[12px] text-muted-2">{t("stickersHint")}</p>
        {card.stickers.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted">{t("noStickers")}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {card.stickers.map((qr) => (
              <li key={qr.id}>
                <Link
                  href={href(`/dashboard/qr/${qr.id}`)}
                  className="group flex items-center gap-3 rounded-(--radius-btn) border border-card-border bg-ink-soft px-3 py-2.5 transition-colors hover:border-line"
                >
                  <IconBubble tone={qr.status === "activated" ? "accent" : "warn"}>
                    <IconQr />
                  </IconBubble>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-mono text-[14px] font-semibold tracking-wide">
                        {qr.code}
                      </span>
                      <Badge tone={qrBadgeTone(qr.status)}>
                        {td(`qrStatus.${qr.status}`)}
                      </Badge>
                    </span>
                    <span className="mt-0.5 block text-[12px] text-muted-2">
                      {t("sticker", { code: qr.code })}
                    </span>
                  </span>
                  <IconChevronRight className="size-5 shrink-0 text-muted-2 transition-colors group-hover:text-white" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        onSubmit={submit}
        className="flex flex-col gap-4 border-t border-card-border pt-4"
        noValidate
      >
        <div>
          <p className="text-[14px] font-semibold">{t("attach.title")}</p>
          <p className="mt-0.5 text-[12px] text-muted-2">{t("attach.hint")}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t("attach.code")}
            placeholder={t("attach.codePlaceholder")}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={LIMITS.qrCodeMax}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="font-mono"
            error={fieldError("code")}
          />
          <Input
            label={t("attach.token")}
            placeholder={t("attach.tokenPlaceholder")}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            maxLength={LIMITS.activationToken}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="font-mono"
            error={fieldError("activation_token")}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            size="sm"
            variant="accent"
            loading={attaching}
            disabled={
              !code.trim() || !token.trim() || (card.busy !== null && !attaching)
            }
          >
            {t("attach.submit")}
          </Button>
          {attached && (
            <span className="text-[13px] font-medium text-accent">
              {t("attach.success", { code: attached })}
            </span>
          )}
          {attachError && (
            <span className="text-[13px] text-danger">{attachError}</span>
          )}
        </div>
      </form>
    </Section>
  );
}
