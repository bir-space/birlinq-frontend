"use client";

import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { BusinessOverviewView } from "@/components/business/BusinessOverviewView";

export default function Page() {
  return (
    <MockShell authenticated>
      <BusinessOverviewView banner={<MockBanner />} />
    </MockShell>
  );
}
