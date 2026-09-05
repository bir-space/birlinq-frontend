"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toApiLocale } from "@birlinq/api";
import { useApi } from "@birlinq/platform";
import { ApiRequestError, publicPartner } from "@birlinq/api";
import type {
  PartnerCode,
  PublicEntityPayload,
  PublicScenario,
} from "@birlinq/api";
import { Button } from "@/components/ui/Button";
import { LangSwitcher } from "@/components/ui/LangSwitcher";
import { Logo } from "@/components/ui/Logo";
import { Spinner } from "@/components/ui/Spinner";
import { PartnerMark } from "@/components/partner/PartnerMark";
import { PartnerTheme } from "@/components/partner/PartnerTheme";
import { PARTNERS } from "@/components/partner/partners";
import { EntityView, entityTitle } from "./EntityView";
import { ScenarioForm } from "./ScenarioForm";
import { ThankYouScreen } from "./ThankYouScreen";
import { AbuseModal } from "./AbuseModal";
import { IconAlertTriangle, IconInfo, IconShieldCheck } from "./icons";

type ErrorKind = "not_found" | "unavailable" | "rate_limited" | "generic";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; payload: PublicEntityPayload }
  | { status: "error"; kind: ErrorKind };

type Screen =
  | { name: "entity" }
  | { name: "scenario"; scenario: PublicScenario }
  | { name: "thanks"; ownerMessage: string | null; duplicate: boolean };

function mapError(err: unknown): ErrorKind {
  if (err instanceof ApiRequestError) {
    if (err.status === 404) return "not_found";
    if (err.status === 410) return "unavailable";
    if (err.status === 429 || err.code === "RATE_LIMITED")
      return "rate_limited";
  }
  return "generic";
}

/**
 * Orchestrator for the public QR scan flow: fetches api.public.scan(code) on
 * mount and switches between loading / error / entity / scenario / thank-you
 * screens. Content is a mobile-first max-w-md column centered on desktop.
 *
 * A partner-sold card (payload.meta.partner) swaps the chrome for the
 * partner's lockup and re-tunes the tokens through PartnerTheme; the flow
 * itself is the same component tree.
 */
export function PublicScanPage({ code }: { code: string }) {
  const t = useTranslations("public");
  const api = useApi();
  const locale = useLocale();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [screen, setScreen] = useState<Screen>({ name: "entity" });
  const [abuseOpen, setAbuseOpen] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    setScreen({ name: "entity" });
    try {
      // Without the locale the scan event is logged against whatever the
      // browser happens to advertise, not the language the page is showing.
      const payload = await api.public.scan(code, toApiLocale(locale));
      setState({ status: "ready", payload });
    } catch (err) {
      setState({ status: "error", kind: mapError(err) });
    }
  }, [api, code, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen.name]);

  // Scenario form brings its own compact header; hide global chrome there.
  const showChrome = !(state.status === "ready" && screen.name === "scenario");
  const partner = state.status === "ready" ? publicPartner(state.payload) : null;

  return (
    <PartnerTheme partner={partner} className="min-h-dvh bg-ink">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-6 pt-5">
      {showChrome && (
        <header className="mb-6 flex items-center justify-between gap-3">
          {partner ? (
            <PartnerMark partner={partner} />
          ) : (
            <div className="flex items-baseline gap-2">
              <Logo />
              <span className="text-sm text-muted-2">· {t("product")}</span>
            </div>
          )}
          {/* The visitor is a stranger with no account: the URL is the only
              place their language lives, so the switcher must be right here. */}
          <LangSwitcher />
        </header>
      )}

      {showChrome && partner && <PartnerStrip partner={partner} />}

      <main className="flex flex-1 flex-col">
        {state.status === "loading" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
            <Spinner className="size-8" />
            <p className="text-sm text-muted-2">{t("loading")}</p>
          </div>
        )}

        {state.status === "error" && (
          <ErrorScreen kind={state.kind} onRetry={load} />
        )}

        {state.status === "ready" && screen.name === "entity" && (
          <EntityView
            payload={state.payload}
            code={code}
            partner={partner}
            onSelectScenario={(scenario) =>
              setScreen({ name: "scenario", scenario })
            }
          />
        )}

        {state.status === "ready" && screen.name === "scenario" && (
          <ScenarioForm
            code={code}
            scenario={screen.scenario}
            entityLabel={entityTitle(
              state.payload,
              t(
                state.payload.entity.type === "personal"
                  ? "entity.personalFallback"
                  : "entity.vehicleFallback"
              )
            )}
            onBack={() => setScreen({ name: "entity" })}
            onSubmitted={({ ownerMessage, duplicate }) =>
              setScreen({ name: "thanks", ownerMessage, duplicate })
            }
            onFatal={(kind) => setState({ status: "error", kind })}
          />
        )}

        {state.status === "ready" && screen.name === "thanks" && (
          <ThankYouScreen
            code={code}
            partner={partner}
            ownerMessage={screen.ownerMessage}
            duplicate={screen.duplicate}
            onClose={() => setScreen({ name: "entity" })}
          />
        )}
      </main>

      {showChrome && (
        <footer className="mt-10 flex flex-col items-center gap-2 pb-2 text-center">
          {partner && (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-2">
              {t("partner.poweredBy")}
              <Logo size="sm" markOnly />
            </p>
          )}
          <p className="text-[11px] text-muted-2">{t("footer.note")}</p>
          <button
            type="button"
            onClick={() => setAbuseOpen(true)}
            className="cursor-pointer text-[11px] text-muted underline underline-offset-2 transition-colors hover:text-white"
          >
            {t("abuse.link")}
          </button>
        </footer>
      )}

      {abuseOpen && (
        <AbuseModal code={code} onClose={() => setAbuseOpen(false)} />
      )}
      </div>
    </PartnerTheme>
  );
}

/**
 * "Official <partner> card" strip under the header — tells the visitor whose
 * customer they are reaching and that the relay (and the privacy) is birlinq's.
 */
function PartnerStrip({ partner }: { partner: PartnerCode }) {
  const t = useTranslations("public");
  const { name } = PARTNERS[partner];
  return (
    <div className="mb-6 flex items-start gap-3 rounded-(--radius-card) border border-accent/25 bg-accent/10 p-4">
      <IconShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" />
      <div>
        <p className="text-[13px] font-semibold text-accent">
          {t("partner.badge", { partner: name })}
        </p>
        <p className="mt-0.5 text-[12px] text-muted">
          {t("partner.intro", { partner: name })}
        </p>
      </div>
    </div>
  );
}

function ErrorScreen({
  kind,
  onRetry,
}: {
  kind: ErrorKind;
  onRetry: () => void;
}) {
  const t = useTranslations("public");

  const config: Record<
    ErrorKind,
    { title: string; text: string; retry: boolean; warn: boolean }
  > = {
    not_found: {
      title: t("errors.notFoundTitle"),
      text: t("errors.notFoundText"),
      retry: false,
      warn: false,
    },
    unavailable: {
      title: t("errors.unavailableTitle"),
      text: t("errors.unavailableText"),
      retry: false,
      warn: false,
    },
    rate_limited: {
      title: t("errors.rateLimitedTitle"),
      text: t("errors.rateLimitedText"),
      retry: true,
      warn: true,
    },
    generic: {
      title: t("errors.genericTitle"),
      text: t("errors.genericText"),
      retry: true,
      warn: true,
    },
  };
  const { title, text, retry, warn } = config[kind];

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <div
        className={`flex size-16 items-center justify-center rounded-full border border-card-border bg-card ${
          warn ? "text-warn" : "text-muted"
        }`}
      >
        {warn ? (
          <IconAlertTriangle className="size-7" />
        ) : (
          <IconInfo className="size-7" />
        )}
      </div>
      <h1 className="mt-5 text-xl font-bold">{title}</h1>
      <p className="mt-2 max-w-xs text-sm text-muted">{text}</p>
      {retry && (
        <Button className="mt-6" onClick={onRetry}>
          {t("errors.retry")}
        </Button>
      )}
    </div>
  );
}
