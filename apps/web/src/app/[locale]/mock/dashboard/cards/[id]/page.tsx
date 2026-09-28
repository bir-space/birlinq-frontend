"use client";

import { use } from "react";
import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { CardEditView } from "@/components/business/CardEditView";

/** Mock counterpart of the card editor — `entity-3` (demo) and `entity-4` live in the fixtures. */
export default function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);
  return (
    <MockShell authenticated>
      <CardEditView id={id} banner={<MockBanner />} />
    </MockShell>
  );
}
