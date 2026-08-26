"use client";

import { Suspense } from "react";
import { PageSpinner } from "@/components/ui/Spinner";
import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { ActivationWizard } from "@/components/activation/ActivationWizard";

export default function Page() {
  return (
    <MockShell>
      <MockBanner />
      <Suspense fallback={<PageSpinner />}>
        <ActivationWizard />
      </Suspense>
    </MockShell>
  );
}
