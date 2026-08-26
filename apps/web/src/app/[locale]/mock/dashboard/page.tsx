"use client";

import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { OverviewView } from "@/components/dashboard/OverviewView";

export default function Page() {
  return (
    <MockShell authenticated>
      <OverviewView banner={<MockBanner />} />
    </MockShell>
  );
}
