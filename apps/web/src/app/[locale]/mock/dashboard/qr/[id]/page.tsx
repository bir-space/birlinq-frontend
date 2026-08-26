"use client";

import { use } from "react";
import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { QrDetailView } from "@/components/dashboard/QrDetailView";

export default function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);
  return (
    <MockShell authenticated>
      <QrDetailView id={id} banner={<MockBanner />} />
    </MockShell>
  );
}
