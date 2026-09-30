import { setRequestLocale } from "next-intl/server";
import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { PublicCardPage } from "@/components/public/PublicCardPage";

/** Mock counterpart of the public card page — `demo`, `k7m2p9xq` (hidden) and `h3k9dn4y` (blocked) live in the fixtures. */
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; alias: string }>;
}) {
  const { locale, alias } = await params;
  setRequestLocale(locale);

  return (
    <MockShell>
      <MockBanner />
      <PublicCardPage alias={alias} />
    </MockShell>
  );
}
