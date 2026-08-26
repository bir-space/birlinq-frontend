"use client";

import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { LoginView } from "@/components/auth/LoginView";

export default function Page() {
  return (
    <MockShell>
      <MockBanner />
      <LoginView />
    </MockShell>
  );
}
