"use client";

import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { ResetPasswordView } from "@/components/auth/ResetPasswordView";

export default function Page() {
  return (
    <MockShell>
      <MockBanner />
      <ResetPasswordView />
    </MockShell>
  );
}
