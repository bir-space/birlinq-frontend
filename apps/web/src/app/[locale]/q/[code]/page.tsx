import { setRequestLocale } from "next-intl/server";
import { PublicScanPage } from "@/components/public/PublicScanPage";

/**
 * Public QR scan page (server shell). The payload is fetched client-side in
 * PublicScanPage so scan latency states (loading / error / retry) stay simple.
 */
export default async function PublicQrPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);

  return <PublicScanPage code={code} />;
}
