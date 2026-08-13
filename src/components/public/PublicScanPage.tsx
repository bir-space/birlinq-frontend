"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useApi } from "@/lib/app-env";
import { ApiRequestError } from "@/lib/api/client";
import type { PublicEntityPayload, PublicScenario } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Spinner } from "@/components/ui/Spinner";
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
  | { name: "thanks"; ownerMessage: string | null };

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
 */
export function PublicScanPage({ code }: { code: string }) {
  const t = useTranslations("public");
  const api = useApi();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [screen, setScreen] = useState<Screen>({ name: "entity" });
  const [abuseOpen, setAbuseOpen] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    setScreen({ name: "entity" });
    try {
      const payload = await api.public.scan(code);
      setState({ status: "ready", payload });
    } catch (err) {
      setState({ status: "error", kind: mapError(err) });
    }
  }, [api, code]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen.name]);

  // Scenario form brings its own compact header; hide global chrome there.
  const showChrome = !(state.status === "ready" && screen.name === "scenario");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-6 pt-5">
      {showChrome && (
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <Logo />
            <span className="text-sm text-muted-2">· {t("product")}</span>
          </div>
          <IconShieldCheck className="size-5 text-accent" />
        </header>
      )}

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
              t("entity.vehicleFallback")
            )}
            onBack={() => setScreen({ name: "entity" })}
            onSubmitted={(ownerMessage) =>
              setScreen({ name: "thanks", ownerMessage })
            }
            onFatal={(kind) => setState({ status: "error", kind })}
          />
        )}

        {state.status === "ready" && screen.name === "thanks" && (
          <ThankYouScreen
            code={code}
            ownerMessage={screen.ownerMessage}
            onClose={() => setScreen({ name: "entity" })}
          />
        )}
      </main>

      {showChrome && (
        <footer className="mt-10 flex flex-col items-center gap-2 pb-2 text-center">
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
