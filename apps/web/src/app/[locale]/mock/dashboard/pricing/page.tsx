"use client";

import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { PricingView } from "@/components/business/PricingView";

export default function Page() {
  return (
    <MockShell authenticated>
      <PricingView banner={<MockBanner />} />
    </MockShell>
  );
}
