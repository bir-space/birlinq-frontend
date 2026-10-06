import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicCardPage } from "@/components/public/PublicCardPage";

type Props = { params: Promise<{ locale: string; alias: string }> };

/**
 * The card is fetched in the browser, never here (FE-014): a server-side
 * fetch would spend the public throttle from one origin and count as the
 * visitor. So the metadata is generic — no name, no photo — and the page is
 * `noindex`: a privacy-first product does not hand phone numbers to
 * crawlers. The title is deliberately the bare word, without the layout's
 * "· birlinq" suffix, so a shared link previews as the card, not the app.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "card" });
  return {
    title: { absolute: t("fallbackName") },
    description: t("footer.note"),
    robots: { index: false, follow: false },
  };
}

export default async function PublicCardRoute({ params }: Props) {
  const { locale, alias } = await params;
  setRequestLocale(locale);

  return <PublicCardPage alias={alias} />;
}
