"use client";

import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { QrListView } from "@/components/dashboard/QrListView";

export default function Page() {
  return (
    <MockShell authenticated>
      <QrListView banner={<MockBanner />} />
    </MockShell>
  );
}
