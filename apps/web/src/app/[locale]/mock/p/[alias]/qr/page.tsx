import { setRequestLocale } from "next-intl/server";
import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { CardQrPage } from "@/components/card/CardQrPage";

/** Mock counterpart of the card's QR page. */
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; alias: string }>;
}) {
  const { locale, alias } = await params;
  setRequestLocale(locale);

  return (
    <MockShell>
      <MockBanner />
      <CardQrPage alias={alias} />
    </MockShell>
  );
}
