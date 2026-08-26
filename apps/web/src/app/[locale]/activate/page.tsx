"use client";

import { Suspense } from "react";
import { PageSpinner } from "@/components/ui/Spinner";
import { ActivationWizard } from "@/components/activation/ActivationWizard";

export default function ActivatePage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <ActivationWizard />
    </Suspense>
  );
}
