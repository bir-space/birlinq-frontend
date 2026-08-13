"use client";

import { Suspense } from "react";
import { PageSpinner } from "@/components/ui/Spinner";
import { MockAuthProvider } from "@/lib/mock/mock-auth";
import { MockBanner } from "@/components/mock/MockBanner";
import { ActivationWizard } from "@/components/mock/activation/ActivationWizard";

export default function MockActivatePage() {
  return (
    <MockAuthProvider>
      <MockBanner />
      <Suspense fallback={<PageSpinner />}>
        <ActivationWizard />
      </Suspense>
    </MockAuthProvider>
  );
}
