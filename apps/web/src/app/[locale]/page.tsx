import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Verticals } from "@/components/landing/Verticals";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { WhyBirlinq } from "@/components/landing/WhyBirlinq";
import { LeadSection } from "@/components/landing/LeadSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing.meta" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Verticals />
        <TrustStrip />
        <WhyBirlinq />
        <LeadSection />
      </main>
      <LandingFooter />
    </div>
  );
}
