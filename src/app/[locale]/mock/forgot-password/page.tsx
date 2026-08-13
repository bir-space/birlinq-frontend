"use client";

import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { ForgotPasswordView } from "@/components/auth/ForgotPasswordView";

export default function Page() {
  return (
    <MockShell>
      <MockBanner />
      <ForgotPasswordView />
    </MockShell>
  );
}
