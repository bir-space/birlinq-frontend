import { setRequestLocale } from "next-intl/server";
import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { PublicScanPage } from "@/components/public/PublicScanPage";

/** Mock counterpart of the public QR scan page — served from fixture data. */
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);

  return (
    <MockShell>
      <MockBanner />
      <PublicScanPage code={code} />
    </MockShell>
  );
}
