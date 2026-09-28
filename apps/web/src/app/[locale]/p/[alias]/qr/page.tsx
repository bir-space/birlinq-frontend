import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CardQrPage } from "@/components/card/CardQrPage";

type Props = { params: Promise<{ locale: string; alias: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "card" });
  return {
    title: { absolute: t("qrPage.title") },
    robots: { index: false, follow: false },
  };
}

/** The card's QR code, shown and downloadable — a client page like the card itself. */
export default async function CardQrRoute({ params }: Props) {
  const { locale, alias } = await params;
  setRequestLocale(locale);

  return <CardQrPage alias={alias} />;
}
