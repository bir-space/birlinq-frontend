"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { toApiLocale } from "@birlinq/api";
import type { PublicEntityPayload, PublicTarget } from "@birlinq/api";
import { useApi, useHref } from "@birlinq/platform";
import { cardUrl } from "@/lib/public-url";
import { Card } from "@/components/ui/Card";
import { AbuseModal } from "@/components/public/AbuseModal";
import { mapPublicError, type PublicErrorKind } from "@/components/public/errors";
import {
  PublicErrorScreen,
  PublicFooter,
  PublicHeader,
  PublicLoading,
} from "@/components/public/PublicPage";
import { IconArrowRight } from "@/components/public/icons";
import { Avatar } from "./Avatar";
import { QrPanel } from "./QrPanel";
import { imageSrc } from "./hrefs";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; payload: PublicEntityPayload }
  | { status: "error"; kind: PublicErrorKind };

/**
 * `/p/{alias}/qr` — the card's QR code, to show across a table or print.
 * The card is fetched first (it counts as one de-duplicated view) so that a
 * hidden or missing card gets its proper screen rather than a code that
 * leads nowhere; the summary under the code comes from the same payload.
 * The URL is built on the client only: `appOrigin()` has no value on the
 * server, and a mismatch there would be a hydration error.
 */
export function CardQrPage({ alias }: { alias: string }) {
  const t = useTranslations("card");
  const tp = useTranslations("public");
  const api = useApi();
  const href = useHref();
  const locale = useLocale();
  const target = useMemo<PublicTarget>(() => ({ kind: "alias", alias }), [alias]);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [url, setUrl] = useState<string | null>(null);
  const [abuseOpen, setAbuseOpen] = useState(false);

  useEffect(() => {
    setUrl(cardUrl(alias));
  }, [alias]);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const payload = await api.public.card(alias, toApiLocale(locale));
      setState({ status: "ready", payload });
    } catch (err) {
      setState({ status: "error", kind: mapPublicError(err) });
    }
  }, [api, alias, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const contact = state.status === "ready" ? state.payload.entity.contact ?? {} : null;
  const name = contact?.display_name?.trim() || t("fallbackName");
  const line = contact
    ? [contact.title, contact.company].filter(Boolean).join(" · ")
    : "";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-6 pt-5">
      <PublicHeader product={tp("productBusiness")} />

      <main className="flex flex-1 flex-col">
        {state.status === "loading" && <PublicLoading />}

        {state.status === "error" && (
          <PublicErrorScreen kind={state.kind} door="alias" onRetry={load} />
        )}

        {state.status === "ready" && contact && url && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-[22px] font-bold">{t("qrPage.title")}</h1>
              <p className="mt-1 text-[13px] text-muted">
                {t("qrPage.subtitle", { name })}
              </p>
            </div>

            <Card className="flex flex-col items-center">
              <QrPanel
                url={url}
                filename={`birlinq-${alias}.png`}
                alt={t("qrPage.subtitle", { name })}
                shareTitle={t("share.title", { name })}
                shareText={t("share.text", { name })}
                hint={t("qrPage.hint")}
                onShare={(channel) => {
                  void api.public
                    .trackEvent(target, { type: "share", channel })
                    .catch(() => {
                      // Analytics only.
                    });
                }}
                className="w-full"
              />
            </Card>

            <Link href={href(`/p/${alias}`)} className="block">
              <Card className="flex items-center gap-3 !p-4 transition-colors hover:border-line">
                <Avatar
                  name={name}
                  src={imageSrc(contact.photo_url)}
                  alt={t("photoAlt", { name })}
                  size="md"
                  className="border border-card-border bg-ink-soft text-white"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{name}</p>
                  {line && (
                    <p className="mt-0.5 truncate text-[13px] text-muted">{line}</p>
                  )}
                  <p className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-accent">
                    {t("qrPage.open")}
                    <IconArrowRight className="size-4" />
                  </p>
                </div>
              </Card>
            </Link>
          </div>
        )}
      </main>

      <PublicFooter onReport={() => setAbuseOpen(true)} />

      {abuseOpen && (
        <AbuseModal target={target} onClose={() => setAbuseOpen(false)} />
      )}
    </div>
  );
}
