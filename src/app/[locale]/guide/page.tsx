import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { GuidePage } from "@/components/public/GuidePage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guide.meta" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function GuideRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GuidePage />;
}
