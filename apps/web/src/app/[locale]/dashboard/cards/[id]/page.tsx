import { use } from "react";
import { CardEditView } from "@/components/business/CardEditView";

export default function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);
  return <CardEditView id={id} />;
}
