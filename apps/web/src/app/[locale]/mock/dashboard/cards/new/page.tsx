"use client";

import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { CardCreateView } from "@/components/business/CardCreateView";

export default function Page() {
  return (
    <MockShell authenticated>
      <CardCreateView banner={<MockBanner />} />
    </MockShell>
  );
}
