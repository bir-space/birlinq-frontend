import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFoundPage() {
  const t = useTranslations("common");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-[64px] font-extrabold leading-none">404</p>
      <p className="text-muted">{t("notFound")}</p>
      <Link
        href="/"
        className="mt-2 rounded-(--radius-btn) bg-white px-6 py-3 text-[15px] font-semibold text-ink-900"
      >
        {t("backHome")}
      </Link>
    </main>
  );
}
