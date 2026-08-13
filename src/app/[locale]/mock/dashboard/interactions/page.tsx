"use client";

import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { InteractionsView } from "@/components/dashboard/InteractionsView";

export default function Page() {
  return (
    <MockShell authenticated>
      <InteractionsView banner={<MockBanner />} />
    </MockShell>
  );
}
