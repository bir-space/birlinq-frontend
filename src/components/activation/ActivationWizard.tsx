"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";
import { LangSwitcher } from "@/components/ui/LangSwitcher";
import { PageSpinner } from "@/components/ui/Spinner";
import { entitiesApi, qrApi } from "@/lib/api/endpoints";
import { ApiRequestError, ErrorCode } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/use-auth";
import type { Entity } from "@/lib/api/types";
import { StepProgress } from "./StepProgress";
import { EntryStep } from "./EntryStep";
import { AuthStep } from "./AuthStep";
import { VehicleStep } from "./VehicleStep";
import { PrivacyStep, type PrivacyFlags } from "./PrivacyStep";
import { SuccessStep } from "./SuccessStep";

type Step = "entry" | "auth" | "vehicle" | "privacy" | "success";

const STEP_NUM: Record<Step, number> = {
  entry: 1,
  auth: 2,
  vehicle: 3,
  privacy: 4,
  success: 5,
};

const TOTAL_STEPS = 5;

type ActivationErrorKey = "entityHasQr" | "alreadyActivated" | "generic";

export function ActivationWizard() {
  const t = useTranslations("activation");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const initialCode = (searchParams.get("code") ?? "").trim();
  const initialToken = (searchParams.get("token") ?? "").trim();

  const [step, setStep] = useState<Step>("entry");
  const [code, setCode] = useState(initialCode);
  const [token, setToken] = useState(initialToken);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] =
    useState<ActivationErrorKey | null>(null);

  // Auth gate auto-skips once the session is known.
  useEffect(() => {
    if (step === "auth" && !authLoading && isAuthenticated) {
      setStep("vehicle");
    }
  }, [step, authLoading, isAuthenticated]);

  const activateHref = code
    ? `/activate?code=${encodeURIComponent(code)}&token=${encodeURIComponent(token)}`
    : "/activate";
  const loginNextHref = `/login?next=${encodeURIComponent(activateHref)}`;

  function handleBack() {
    if (step === "auth") setStep("entry");
    else if (step === "vehicle") setStep(isAuthenticated ? "entry" : "auth");
    else if (step === "privacy") {
      setActivationError(null);
      setStep("vehicle");
    }
  }

  async function handlePrivacySubmit(flags: PrivacyFlags) {
    if (!entity) return;
    setActivating(true);
    setActivationError(null);
    try {
      // PATCH privacy returns the updated entity — keep it so a retry after a
      // failed activation starts from the flags the server actually stored.
      const { entity: updated } = await entitiesApi.updatePrivacy(
        entity.id,
        flags
      );
      setEntity(updated);
      await qrApi.activate({
        code,
        activation_token: token,
        entity_id: entity.id,
      });
      setStep("success");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.code === ErrorCode.QrAlreadyActivated) {
          setActivationError("alreadyActivated");
        } else if (
          err.code === ErrorCode.EntityAlreadyHasQr ||
          err.status === 409
        ) {
          setActivationError("entityHasQr");
        } else {
          setActivationError("generic");
        }
      } else {
        setActivationError("generic");
      }
    } finally {
      setActivating(false);
    }
  }

  const showWizardHeader =
    step === "auth" || step === "vehicle" || step === "privacy";

  return (
    <div className="flex min-h-dvh flex-col">
      {showWizardHeader ? (
        <header className="mx-auto w-full max-w-md px-5 pt-4">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              aria-label={tc("back")}
              className="flex size-9 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-card hover:text-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M14.5 5.5L8 12l6.5 6.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <p className="truncate text-center font-bold">
              {t(`headers.${step as "auth" | "vehicle" | "privacy"}`)}
            </p>
            <p className="text-[12px] text-muted-2">
              {t("stepLabel", { current: STEP_NUM[step], total: TOTAL_STEPS })}
            </p>
          </div>
          <div className="mt-4">
            <StepProgress current={STEP_NUM[step]} total={TOTAL_STEPS} />
          </div>
        </header>
      ) : (
        <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-4">
          <div className="flex items-baseline gap-2">
            <Logo />
            <span className="text-sm text-muted-2">{t("productMove")}</span>
          </div>
          <div className="flex items-center gap-3">
            {step === "entry" &&
              (isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="text-[13px] font-semibold text-muted hover:text-white"
                >
                  {tc("dashboard")}
                </Link>
              ) : (
                <Link
                  href={loginNextHref}
                  className="text-[13px] font-semibold text-muted hover:text-white"
                >
                  {tc("login")}
                </Link>
              ))}
            <LangSwitcher />
          </div>
        </header>
      )}

      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-12 pt-2">
        {step === "entry" && (
          <EntryStep
            initialCode={code}
            initialToken={token}
            loginNextHref={loginNextHref}
            onVerified={(verifiedCode, verifiedToken) => {
              setCode(verifiedCode);
              setToken(verifiedToken);
              setStep("auth");
            }}
          />
        )}

        {step === "auth" &&
          (authLoading || isAuthenticated ? (
            <PageSpinner />
          ) : (
            <AuthStep
              loginNextHref={loginNextHref}
              onDone={() => setStep("vehicle")}
            />
          ))}

        {step === "vehicle" && (
          <VehicleStep
            onDone={(selected) => {
              setEntity(selected);
              setActivationError(null);
              setStep("privacy");
            }}
            onBack={handleBack}
          />
        )}

        {step === "privacy" && entity && (
          <PrivacyStep
            entity={entity}
            submitting={activating}
            errorKey={activationError}
            onSubmit={handlePrivacySubmit}
            onBack={handleBack}
            onChooseAnother={() => {
              setActivationError(null);
              setStep("vehicle");
            }}
          />
        )}

        {step === "success" && <SuccessStep />}
      </main>
    </div>
  );
}
