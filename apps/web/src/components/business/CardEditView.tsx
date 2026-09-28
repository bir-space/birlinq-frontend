"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useHref } from "@birlinq/platform";
import { useCard } from "@birlinq/core";
import { Card } from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  BackLink,
  ErrorCard,
  IconExternal,
} from "@/components/dashboard/bits";
import { Avatar } from "@/components/card/Avatar";
import { imageSrc } from "@/components/card/hrefs";
import { CardStatusBadge } from "@/components/business/bits";
import {
  type SectionFeedback,
  type SectionKey,
} from "@/components/business/sections/shared";
import { ProfileSection } from "@/components/business/sections/ProfileSection";
import { ImagesSection } from "@/components/business/sections/ImagesSection";
import { ContactsSection } from "@/components/business/sections/ContactsSection";
import { SocialsSection } from "@/components/business/sections/SocialsSection";
import { TagsSection } from "@/components/business/sections/TagsSection";
import { ThemeSection } from "@/components/business/sections/ThemeSection";
import { PrivacySection } from "@/components/business/sections/PrivacySection";
import { AliasSection } from "@/components/business/sections/AliasSection";
import { PublishSection } from "@/components/business/sections/PublishSection";
import { QrSection } from "@/components/business/sections/QrSection";
import { StatsSection } from "@/components/business/sections/StatsSection";
import { DangerSection } from "@/components/business/sections/DangerSection";

export function CardEditView({
  id,
  banner,
}: {
  id: string;
  banner?: ReactNode;
}) {
  return (
    <DashboardShell banner={banner}>
      <CardEdit id={id} />
    </DashboardShell>
  );
}

interface LastWrite {
  section: SectionKey;
  ok: boolean;
}

/**
 * One card, every section of it. `useCard` owns the entity and the writes;
 * this component only remembers which section wrote last, so that section
 * alone shows "saved" or the failure next to its own button.
 */
function CardEdit({ id }: { id: string }) {
  const t = useTranslations("cards");
  const href = useHref();
  const card = useCard(id);
  const [last, setLast] = useState<LastWrite | null>(null);

  // A `#qr` link from the list arrives before the sections exist, so the
  // browser finds nothing to scroll to; do it once the entity is in.
  const entityId = card.entity?.id;
  useEffect(() => {
    if (!entityId) return;
    const anchor = window.location.hash.slice(1);
    if (anchor) document.getElementById(anchor)?.scrollIntoView({ block: "start" });
  }, [entityId]);

  const runFor =
    (section: SectionKey) => async (write: () => Promise<boolean>) => {
      const ok = await write();
      setLast({ section, ok });
      return ok;
    };

  const feedbackFor = (section: SectionKey): SectionFeedback =>
    last?.section === section ? (last.ok ? "saved" : "error") : null;

  if (card.loading) return <PageSpinner />;

  if (card.error || !card.entity) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink href={href("/dashboard/cards")} label={t("edit.back")} />
        <ErrorCard
          message={
            card.error === "notFound"
              ? `${t("edit.notFound")} ${t("edit.notFoundHint")}`
              : t("edit.loadError")
          }
          retryLabel={t("stats.retry")}
          onRetry={card.error === "notFound" ? undefined : card.retry}
        />
      </div>
    );
  }

  const entity = card.entity;
  const profile = entity.contact_profile;
  const name = profile?.display_name?.trim() || t("list.noName");
  const line = [profile?.title, profile?.company].filter(Boolean).join(" · ");

  const sectionProps = (section: SectionKey) => ({
    card,
    entity,
    feedback: feedbackFor(section),
    run: runFor(section),
  });

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={href("/dashboard/cards")} label={t("edit.back")} />

      {/* Header card */}
      <Card className="flex items-center gap-4">
        <Avatar
          name={name}
          src={imageSrc(profile?.photo_url)}
          size="md"
          className="border border-card-border bg-ink-soft text-white"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-[18px] font-bold">{name}</h1>
            <CardStatusBadge status={entity.status} />
          </div>
          {line && (
            <p className="mt-0.5 truncate text-[13px] text-muted">{line}</p>
          )}
          {entity.alias && (
            <Link
              href={href(`/p/${entity.alias}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent transition-colors hover:text-white"
            >
              <IconExternal />
              {t("edit.open")}
            </Link>
          )}
        </div>
      </Card>

      {entity.status === "blocked" && (
        <p className="rounded-(--radius-btn) border border-danger/30 bg-danger/10 px-4 py-2.5 text-[13px] text-danger">
          {t("edit.blocked")}
        </p>
      )}

      <ProfileSection {...sectionProps("profile")} />
      <ImagesSection {...sectionProps("images")} />
      <ContactsSection {...sectionProps("contacts")} />
      <SocialsSection {...sectionProps("socials")} />
      <TagsSection {...sectionProps("tags")} />
      <ThemeSection {...sectionProps("theme")} />
      <PrivacySection {...sectionProps("privacy")} />
      <AliasSection {...sectionProps("alias")} />
      <PublishSection {...sectionProps("publish")} />
      <QrSection {...sectionProps("qr")} />
      <StatsSection id={entity.id} />
      <DangerSection {...sectionProps("danger")} />
    </div>
  );
}
