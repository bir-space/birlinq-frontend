"use client";

import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { VerifyEmailView } from "@/components/auth/VerifyEmailView";

export default function Page() {
  return (
    <MockShell>
      <MockBanner />
      <VerifyEmailView />
    </MockShell>
  );
}
