"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type {
  PublicContact,
  PublicEntityPayload,
  PublicScenario,
} from "@birlinq/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LeadForm } from "./LeadForm";
import {
  IconBriefcase,
  IconCar,
  IconChevronRight,
  IconMail,
  IconPhone,
  IconShieldCheck,
  IconTelegram,
  IconUser,
  IconWhatsapp,
  ScenarioIcon,
} from "./icons";

/**
 * Human title for the scanned entity: custom title → make+model (car) →
 * display name (personal) → fallback.
 */
export function entityTitle(
  payload: PublicEntityPayload,
  fallback: string
): string {
  if (payload.entity.title) return payload.entity.title;
  const v = payload.entity.vehicle;
  const makeModel = [v?.make, v?.model].filter(Boolean).join(" ");
  if (makeModel) return makeModel;
  return payload.entity.contact?.display_name || fallback;
}

/**
 * One tappable contact channel. `href` is null for a channel that is only
 * worth showing as text (company).
 */
interface Channel {
  key: keyof PublicContact;
  value: string;
  href: string | null;
  icon: ReactNode;
}

/** Strip everything but digits and a leading + — safe for tel:/wa.me links. */
function telHref(raw: string): string {
  return `tel:${raw.replace(/[^\d+]/g, "")}`;
}

function whatsappHref(raw: string): string {
  return `https://wa.me/${raw.replace(/\D/g, "")}`;
}

function telegramHref(raw: string): string {
  const handle = raw.replace(/^@/, "").replace(/^https?:\/\/t\.me\//, "");
  return `https://t.me/${handle}`;
}

/**
 * Build the channel list from whatever survived the backend's PrivacyFilter.
 *
 * Only keys the owner opted into are present at all — a hidden channel is
 * *omitted*, never sent as null — so "field is here" and "owner allows it"
 * are the same question and this function never needs privacy flags.
 */
function contactChannels(contact: PublicContact): Channel[] {
  const out: Channel[] = [];
  const push = (
    key: keyof PublicContact,
    value: string | undefined,
    href: string | null,
    icon: ReactNode
  ) => {
    if (value) out.push({ key, value, href, icon });
  };

  push(
    "phone",
    contact.phone,
    contact.phone ? telHref(contact.phone) : null,
    <IconPhone className="size-5" />
  );
  push(
    "phone2",
    contact.phone2,
    contact.phone2 ? telHref(contact.phone2) : null,
    <IconPhone className="size-5" />
  );
  push(
    "whatsapp",
    contact.whatsapp,
    contact.whatsapp ? whatsappHref(contact.whatsapp) : null,
    <IconWhatsapp className="size-5" />
  );
  push(
    "telegram",
    contact.telegram,
    contact.telegram ? telegramHref(contact.telegram) : null,
    <IconTelegram className="size-5" />
  );
  push(
    "email",
    contact.email,
    contact.email ? `mailto:${contact.email}` : null,
    <IconMail className="size-5" />
  );
  push(
    "company",
    contact.company,
    null,
    <IconBriefcase className="size-5" />
  );

  return out;
}

/**
 * P1 — main public page after scanning a QR: entity card with privacy badge,
 * scenario list, privacy banner and the "I want a sticker" lead block.
 * Handles both entity types the backend can return: `car` (vehicle block) and
 * `personal` (contact block, every channel opt-in).
 */
export function EntityView({
  payload,
  code,
  onSelectScenario,
}: {
  payload: PublicEntityPayload;
  code: string;
  onSelectScenario: (scenario: PublicScenario) => void;
}) {
  const t = useTranslations("public");
  const [leadOpen, setLeadOpen] = useState(false);

  const isPersonal = payload.entity.type === "personal";
  const vehicle = payload.entity.vehicle;
  const contact = payload.entity.contact;
  const channels = contact ? contactChannels(contact) : [];

  const makeModel = [vehicle?.make, vehicle?.model].filter(Boolean).join(" ");
  const title = entityTitle(
    payload,
    t(isPersonal ? "entity.personalFallback" : "entity.vehicleFallback")
  );
  const subtitle = isPersonal
    ? contact?.company ?? null
    : [vehicle?.color, makeModel && makeModel !== title ? makeModel : null]
        .filter(Boolean)
        .join(" · ");

  return (
    <div className="flex flex-col">
      {/* Entity card */}
      <Card className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-card-border bg-ink-soft text-accent">
          {isPersonal ? (
            <IconUser className="size-7" />
          ) : (
            <IconCar className="size-7" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[18px] font-bold leading-snug">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          {isPersonal && contact?.bio && (
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              {contact.bio}
            </p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {vehicle?.license_plate && (
              <span className="inline-flex items-center rounded-lg border border-line bg-ink-soft px-2 py-0.5 font-mono text-[12px] font-semibold tracking-wider text-white">
                {vehicle.license_plate}
              </span>
            )}
            {vehicle?.year && (
              <span className="text-[12px] text-muted-2">{vehicle.year}</span>
            )}
            {payload.meta.privacy_badge !== false && (
              <Badge tone="accent" className="normal-case tracking-normal">
                <IconShieldCheck className="size-3" />
                {t("entity.hiddenBadge")}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Contact channels — personal entities only, and only what the owner
          chose to publish. An empty list is a normal state, not an error. */}
      {isPersonal && channels.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[15px] font-bold">{t("entity.contactTitle")}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {channels.map((channel) => {
              const inner = (
                <>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ink-soft text-accent">
                    {channel.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] uppercase tracking-wide text-muted-2">
                      {t(`entity.channels.${channel.key}`)}
                    </span>
                    <span className="block truncate text-[14px] font-medium text-white">
                      {channel.value}
                    </span>
                  </span>
                  {channel.href && (
                    <IconChevronRight className="size-4 shrink-0 text-muted-2" />
                  )}
                </>
              );
              const className =
                "flex w-full items-center gap-3 rounded-(--radius-card) border border-card-border bg-card p-3.5 text-left";
              return (
                <li key={channel.key}>
                  {channel.href ? (
                    <a
                      href={channel.href}
                      className={`${className} transition-colors hover:bg-[#16233d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
                      {...(channel.href.startsWith("https://")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className={className}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Scenario list */}
      <section className="mt-8">
        <h2 className="text-[22px] font-bold">{t("entity.whatHappened")}</h2>
        <p className="mt-1 text-[13px] text-muted">{t("entity.choose")}</p>
        <ul className="mt-4 flex flex-col gap-3">
          {payload.scenarios.map((scenario) => (
            <li key={scenario.id}>
              <button
                type="button"
                onClick={() => onSelectScenario(scenario)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-(--radius-card) border border-card-border bg-card p-4 text-left transition-colors hover:bg-[#16233d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ink-soft text-accent">
                  <ScenarioIcon
                    hint={`${scenario.icon ?? ""} ${scenario.code}`}
                    className="size-5"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium text-white">
                    {scenario.title}
                  </span>
                  {scenario.description && (
                    <span className="mt-0.5 block text-[12px] text-muted-2">
                      {scenario.description}
                    </span>
                  )}
                </span>
                <IconChevronRight className="size-4 shrink-0 text-muted-2" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Privacy banner */}
      <div className="mt-6 flex items-start gap-3 rounded-(--radius-card) border border-accent/20 bg-accent/10 p-4">
        <IconShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" />
        <div>
          <p className="text-[13px] font-semibold text-accent">
            {t("entity.privacyTitle")}
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            {t("entity.privacyText")}
          </p>
        </div>
      </div>

      {/* Lead CTA / inline lead form */}
      <div className="mt-6">
        {leadOpen ? (
          <Card>
            <p className="text-[15px] font-bold">{t("lead.cardTitle")}</p>
            <p className="mt-0.5 text-[12px] text-muted">
              {t("lead.cardText")}
            </p>
            <div className="mt-4">
              <LeadForm code={code} />
            </div>
          </Card>
        ) : (
          <button
            type="button"
            onClick={() => setLeadOpen(true)}
            className="w-full cursor-pointer rounded-(--radius-card) border border-line p-4 text-center transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="block text-[15px] font-bold text-white">
              {t("lead.cta")}
            </span>
            <span className="mt-0.5 block text-[11px] text-muted-2">
              {t("lead.ctaSub")}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
