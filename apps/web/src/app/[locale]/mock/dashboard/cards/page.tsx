"use client";

import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { CardsListView } from "@/components/business/CardsListView";

export default function Page() {
  return (
    <MockShell authenticated>
      <CardsListView banner={<MockBanner />} />
    </MockShell>
  );
}
