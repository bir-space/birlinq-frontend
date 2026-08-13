import { use } from "react";
import { QrDetailView } from "@/components/dashboard/QrDetailView";

export default function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);
  return <QrDetailView id={id} />;
}
