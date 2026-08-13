import { setRequestLocale } from "next-intl/server";
import { PublicScanPage } from "@/components/mock/public/PublicScanPage";

/** Mock counterpart of the public QR scan page — served from fixture data. */
export default async function MockPublicQrPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);

  return <PublicScanPage code={code} />;
}
