import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { WebPlatform } from "@/lib/platform";
import { AuthProvider } from "@/lib/auth/auth-provider";

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
  manifest: "/manifest.webmanifest",
  // iOS reads these when the site is added to the Home Screen, which is the
  // only way push works there at all.
  appleWebApp: {
    capable: true,
    title: "birlinq",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
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
