import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return { title: t("docs.offer") };
}

export default async function OfferRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalPage doc="offer" locale={locale} />;
}
