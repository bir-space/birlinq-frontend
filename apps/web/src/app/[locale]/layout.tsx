import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { WebPlatform } from "@/lib/platform";
import { AuthProvider } from "@/lib/auth/use-auth";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "birlinq — QR-стикеры для связи с владельцем",
    template: "%s · birlinq",
  },
  description:
    "birlinq — умные QR-наклейки: свяжитесь с владельцем машины или вещи, не раскрывая личных данных.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html lang={locale} className={inter.variable}>
      <body className="font-sans">
        <NextIntlClientProvider>
          <WebPlatform>
            <AuthProvider>{children}</AuthProvider>
          </WebPlatform>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
