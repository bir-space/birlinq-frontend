"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toApiLocale } from "@birlinq/api";
import { useApi } from "@birlinq/platform";
import { markReferrerSent, pendingReferrerHost } from "@/lib/public-url";
import type {
  CardTheme,
  PublicEntityPayload,
  PublicScenario,
  PublicTarget,
} from "@birlinq/api";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Spinner } from "@/components/ui/Spinner";
import { BusinessCardView } from "@/components/card/BusinessCardView";
import { EntityView, entityTitle } from "./EntityView";
import { ScenarioForm } from "./ScenarioForm";
import { ThankYouScreen } from "./ThankYouScreen";
import { AbuseModal } from "./AbuseModal";
import { mapPublicError, type PublicErrorKind } from "./errors";
import { IconAlertTriangle, IconInfo, IconShieldCheck } from "./icons";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; payload: PublicEntityPayload }
  | { status: "error"; kind: PublicErrorKind };

type Screen =
  | { name: "entity" }
  | { name: "scenario"; scenario: PublicScenario }
  | { name: "thanks"; ownerMessage: string | null; duplicate: boolean };

/**
 * Orchestrator of both public doors (D-040): a sticker (`/q/{code}`) and a
 * card's link (`/p/{alias}`). Fetches the payload on mount — from the
 * browser, never server-side (FE-014) — and switches between loading /
 * error / entity / scenario / thank-you. A `car` renders `EntityView`, a
 * `personal` renders the business card; scenarios and the lead form exist
 * behind the sticker only, the abuse link behind both.
 */
export function PublicPage({
  target,
  themeOverride = null,
}: {
  target: PublicTarget;
  themeOverride?: CardTheme | null;
}) {
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
      // Without the locale the event is logged against whatever the
      // browser advertises, not the language the page is showing. The
      // referrer's host travels along on the first successful fetch of the
      // document only (D-045) — a language switch refetches, and must not
      // count the same arrival twice.
      const apiLocale = toApiLocale(locale);
      const referrerHost = pendingReferrerHost();
      const payload =
        target.kind === "qr"
          ? await api.public.scan(target.code, apiLocale, referrerHost)
          : await api.public.card(target.alias, apiLocale, referrerHost);
      markReferrerSent();
      setState({ status: "ready", payload });
    } catch (err) {
      setState({ status: "error", kind: mapPublicError(err) });
    }
  }, [api, target, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen.name]);

  // Scenario form brings its own compact header; hide global chrome there.
  const showChrome = !(state.status === "ready" && screen.name === "scenario");

  const product =
    state.status === "ready"
      ? state.payload.entity.type === "personal"
        ? t("productBusiness")
        : t("productMove")
      : target.kind === "alias"
        ? t("productBusiness")
        : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-6 pt-5">
      {showChrome && <PublicHeader product={product} />}

      <main className="flex flex-1 flex-col">
        {state.status === "loading" && <PublicLoading />}

        {state.status === "error" && (
          <PublicErrorScreen
            kind={state.kind}
            door={target.kind}
            onRetry={load}
          />
        )}

        {state.status === "ready" &&
          screen.name === "entity" &&
          (state.payload.entity.type === "personal" ? (
            <BusinessCardView
              payload={state.payload}
              target={target}
              themeOverride={themeOverride}
              onSelectScenario={
                target.kind === "qr"
                  ? (scenario) => setScreen({ name: "scenario", scenario })
                  : undefined
              }
            />
          ) : target.kind === "qr" ? (
            <EntityView
              payload={state.payload}
              code={target.code}
              onSelectScenario={(scenario) =>
                setScreen({ name: "scenario", scenario })
              }
            />
          ) : (
            // A link resolves to `personal` cards only (D-040); anything
            // else here is a contract drift, shown as "not found".
            <PublicErrorScreen kind="not_found" door="alias" onRetry={load} />
          ))}

        {state.status === "ready" &&
          screen.name === "scenario" &&
          target.kind === "qr" && (
            <ScenarioForm
              code={target.code}
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

        {state.status === "ready" &&
          screen.name === "thanks" &&
          target.kind === "qr" && (
            <ThankYouScreen
              code={target.code}
              entityType={state.payload.entity.type}
              ownerMessage={screen.ownerMessage}
              duplicate={screen.duplicate}
              onClose={() => setScreen({ name: "entity" })}
            />
          )}
      </main>

      {showChrome && <PublicFooter onReport={() => setAbuseOpen(true)} />}

      {abuseOpen && (
        <AbuseModal target={target} onClose={() => setAbuseOpen(false)} />
      )}
    </div>
  );
}

/** Logo, "· Move" / "· Business", shield. */
export function PublicHeader({ product }: { product: string | null }) {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div className="flex items-baseline gap-2">
        <Logo />
        {product && <span className="text-sm text-muted-2">· {product}</span>}
      </div>
      <IconShieldCheck className="size-5 text-accent" />
    </header>
  );
}

/** The note line and the abuse link — present on every public screen. */
export function PublicFooter({ onReport }: { onReport: () => void }) {
  const t = useTranslations("public");
  return (
    <footer className="mt-10 flex flex-col items-center gap-2 pb-2 text-center">
      <p className="text-[11px] text-muted-2">{t("footer.note")}</p>
      <button
        type="button"
        onClick={onReport}
        className="cursor-pointer text-[11px] text-muted underline underline-offset-2 transition-colors hover:text-white"
      >
        {t("abuse.link")}
      </button>
    </footer>
  );
}

export function PublicLoading() {
  const t = useTranslations("public");
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
      <Spinner className="size-8" />
      <p className="text-sm text-muted-2">{t("loading")}</p>
    </div>
  );
}

/**
 * One screen per `PublicErrorKind`. "Not found" reads differently behind
 * each door — a mistyped link versus a sticker that is not in the system.
 */
export function PublicErrorScreen({
  kind,
  door,
  onRetry,
}: {
  kind: PublicErrorKind;
  door: PublicTarget["kind"];
  onRetry: () => void;
}) {
  const t = useTranslations("public");

  const config: Record<
    PublicErrorKind,
    { title: string; text: string; retry: boolean; warn: boolean }
  > = {
    not_found:
      door === "alias"
        ? {
            title: t("errors.cardNotFoundTitle"),
            text: t("errors.cardNotFoundText"),
            retry: false,
            warn: false,
          }
        : {
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
    unpublished: {
      title: t("errors.unpublishedTitle"),
      text: t("errors.unpublishedText"),
      retry: false,
      warn: false,
    },
    blocked: {
      title: t("errors.blockedTitle"),
      text: t("errors.blockedText"),
      retry: false,
      warn: true,
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
