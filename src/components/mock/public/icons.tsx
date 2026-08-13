import type { SVGProps } from "react";

/**
 * Inline SVG icon set for the public scan flow (conventions: no external
 * assets — decor is recreated with CSS/SVG). 24px grid, stroke = currentColor.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconCar(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.4 10l-2-4A2 2 0 0 0 14.6 5H9.4a2 2 0 0 0-1.8 1.1l-2 4-2.1 1.1C2.7 12.3 2 13.1 2 14v2c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
      <path d="M9 17h6" />
    </Svg>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </Svg>
  );
}

export function IconArrowLeft(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </Svg>
  );
}

export function IconWindow(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 4v16" />
      <path d="M3 12h18" />
    </Svg>
  );
}

export function IconBell(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
    </Svg>
  );
}

export function IconAlertTriangle(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Svg>
  );
}

export function IconChat(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

export function IconTruck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.6a1 1 0 0 0-.3-.7l-3.4-3.4a1 1 0 0 0-.7-.3H14" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </Svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.7 9a.6.6 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .7-1c3-.9 5-1.9 6.7-2.9a1.2 1.2 0 0 1 1.2 0c1.7 1 3.7 2 6.7 2.9A1 1 0 0 1 20 6z" />
    </Svg>
  );
}

export function IconShieldCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.7 9a.6.6 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .7-1c3-.9 5-1.9 6.7-2.9a1.2 1.2 0 0 1 1.2 0c1.7 1 3.7 2 6.7 2.9A1 1 0 0 1 20 6z" />
      <path d="m9 12 2 2 4-4" />
    </Svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9 18 6-6-6-6" />
    </Svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Svg>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </Svg>
  );
}

export function IconFlag(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <path d="M4 22v-7" />
    </Svg>
  );
}

/**
 * Maps a backend scenario hint (icon code + scenario code) to a glyph.
 * Backend sends codes like "car_blocking"; unknown codes fall back to chat.
 */
export function ScenarioIcon({
  hint,
  className,
}: {
  hint: string;
  className?: string;
}) {
  const h = hint.toLowerCase();
  if (/(block|move|road|way)/.test(h)) return <IconArrowRight className={className} />;
  if (/(window|glass|open)/.test(h)) return <IconWindow className={className} />;
  if (/(alarm|bell|signal)/.test(h)) return <IconBell className={className} />;
  if (/(accident|crash|urgent|damage|dtp|emergency)/.test(h))
    return <IconAlertTriangle className={className} />;
  if (/(tow|evac|truck)/.test(h)) return <IconTruck className={className} />;
  if (/(light|head)/.test(h)) return <IconCar className={className} />;
  return <IconChat className={className} />;
}
