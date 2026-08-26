import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { BusinessCardVisual, CarVisual, TagVisual } from "./decor";

type VerticalKey = "move" | "business" | "id";

const VISUALS: Record<VerticalKey, ReactNode> = {
  move: <CarVisual className="w-full max-w-[220px]" />,
  business: <BusinessCardVisual className="w-full max-w-[220px]" />,
  id: <TagVisual className="w-full max-w-[220px]" />,
};

/** Brand names — not translated. Maps to the vertical color token. */
const PILL: Record<VerticalKey, { label: string; token: "move" | "biz" | "id" }> = {
  move: { label: "Move", token: "move" },
  business: { label: "Business", token: "biz" },
  id: { label: "ID", token: "id" },
};

const COLOR_CLASSES = {
  move: {
    border: "hover:border-move/50",
    glow: "bg-move/10",
    pillBg: "bg-move/15",
    pillText: "text-move",
    dot: "bg-move",
    cta: "hover:border-move hover:text-move",
  },
  biz: {
    border: "hover:border-biz/50",
    glow: "bg-biz/10",
    pillBg: "bg-biz/15",
    pillText: "text-biz",
    dot: "bg-biz",
    cta: "hover:border-biz hover:text-biz",
  },
  id: {
    border: "hover:border-id/50",
    glow: "bg-id/10",
    pillBg: "bg-id/15",
    pillText: "text-id",
    dot: "bg-id",
    cta: "hover:border-id hover:text-id",
  },
} as const;

function VerticalCard({ vertical }: { vertical: VerticalKey }) {
  const t = useTranslations("landing.verticals");
  const bullets = ["B1", "B2", "B3"] as const;
  const pill = PILL[vertical];
  const colors = COLOR_CLASSES[pill.token];

  return (
    <Card
      id={vertical}
      className={`group relative flex scroll-mt-24 flex-col gap-4 overflow-hidden p-6 transition-colors ${colors.border}`}
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-16 size-[220px] rounded-full blur-3xl transition-opacity ${colors.glow}`}
        aria-hidden
      />

      <div className="relative flex items-center justify-between gap-3">
        <span
          className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${colors.pillBg} ${colors.pillText}`}
        >
          {pill.label}
        </span>
        <span
          className="grid size-8 shrink-0 place-items-center rounded-full border border-card-border text-muted transition-colors group-hover:border-white/30 group-hover:text-white"
          aria-hidden
        >
          →
        </span>
      </div>

      <h3 className="relative text-[22px] font-bold tracking-tight">
        {t(`${vertical}Title`)}
      </h3>

      <p className="relative text-[15px] leading-relaxed text-muted">
        {t(`${vertical}Text`)}
      </p>

      <ul className="relative space-y-2.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-[14px] text-muted">
            <span
              className={`mt-[7px] size-1.5 shrink-0 rounded-full ${colors.dot}`}
              aria-hidden
            />
            {t(`${vertical}${b}`)}
          </li>
        ))}
      </ul>

      <div className="relative mt-auto flex items-end justify-between gap-4 pt-2">
        <a
          href="#lead"
          className={`inline-flex h-9 items-center rounded-full border border-card-border px-4 text-[13px] font-semibold text-white transition-colors ${colors.cta}`}
        >
          {t("more")}
        </a>
        <div aria-hidden className="w-[45%] min-w-[120px]">
          {VISUALS[vertical]}
        </div>
      </div>
    </Card>
  );
}

export function Verticals() {
  const t = useTranslations("landing.verticals");

  return (
    <section id="verticals" className="scroll-mt-24 py-6 md:py-10">
      <div className="mx-auto w-full max-w-[1200px] px-5 md:px-10">
        <h2 className="text-[28px] font-bold tracking-tight sm:text-[32px]">
          {t("heading")}
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <VerticalCard vertical="move" />
          <VerticalCard vertical="business" />
          <VerticalCard vertical="id" />
        </div>
      </div>
    </section>
  );
}
