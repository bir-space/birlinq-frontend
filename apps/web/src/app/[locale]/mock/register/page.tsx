"use client";

import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { RegisterView } from "@/components/auth/RegisterView";

export default function Page() {
  return (
    <MockShell>
      <MockBanner />
      <RegisterView />
    </MockShell>
  );
}
