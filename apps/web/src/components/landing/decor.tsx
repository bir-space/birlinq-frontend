import { LogoMark } from "@/components/ui/LogoMark";

/**
 * Decorative visuals for the landing page — pure CSS / inline SVG, no
 * hotlinked assets. Palette follows the "bq" logo: brand-blue → brand-violet,
 * with the three verticals (Move / ID / Business) tinted move / id / biz.
 * Everything here is presentational only (aria-hidden).
 */

type Vertical = "move" | "id" | "biz";

const VERTICAL_HEX: Record<Vertical, string> = {
  move: "#2e63e0",
  id: "#8b5cf6",
  biz: "#22c55e",
};

const QR_SIZE = 21;

function inFinder(r: number, c: number): boolean {
  return (
    (r < 7 && c < 7) ||
    (r < 7 && c >= QR_SIZE - 7) ||
    (r >= QR_SIZE - 7 && c < 7)
  );
}

/** Deterministic pseudo-random modules so server & client render identically. */
const QR_CELLS: ReadonlyArray<readonly [number, number]> = (() => {
  let seed = 20240717;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const cells: Array<readonly [number, number]> = [];
  for (let r = 0; r < QR_SIZE; r++) {
    for (let c = 0; c < QR_SIZE; c++) {
      if (inFinder(r, c)) continue;
      if (rand() < 0.44) cells.push([r, c] as const);
    }
  }
  return cells;
})();

function Finder({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect
        x={x + 0.5}
        y={y + 0.5}
        width={6}
        height={6}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
      />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="currentColor" />
    </g>
  );
}

/** Stylised QR code, colored via `currentColor`. */
export function QrPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`}
      className={className}
      aria-hidden
      focusable="false"
    >
      <Finder x={0} y={0} />
      <Finder x={QR_SIZE - 7} y={0} />
      <Finder x={0} y={QR_SIZE - 7} />
      {QR_CELLS.map(([r, c]) => (
        <rect
          key={`${r}-${c}`}
          x={c}
          y={r}
          width={1}
          height={1}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

/** Brand wordmark + "bq" mark, rendered as decorative text (not a link). */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold tracking-tight text-white ${className}`}
      aria-hidden
    >
      <LogoMark size={16} className="shrink-0" />
      birlinq
    </span>
  );
}

/**
 * Phone mockup with a birlinq app screen inside.
 * `vertical` tints the badge/QR frame to that product's brand color.
 */
export function PhoneMockup({
  label,
  vertical,
  className = "",
}: {
  label?: "Move" | "Business" | "ID";
  vertical?: Vertical;
  className?: string;
}) {
  const hex = vertical ? VERTICAL_HEX[vertical] : "#2e63e0";
  return (
    <div
      className={`rounded-[2.4rem] border border-line bg-ink-soft p-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] ${className}`}
      aria-hidden
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[1.9rem] border border-card-border bg-card">
        {/* notch */}
        <div className="flex justify-center pt-2.5">
          <div className="h-1.5 w-14 rounded-full bg-white/15" />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <Wordmark className="text-[15px]" />
            {label && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: `${hex}26`, color: hex }}
              >
                {label}
              </span>
            )}
          </div>
          <div className="grid place-items-center rounded-2xl bg-white/95 p-3">
            <QrPattern className="w-full max-w-[110px] text-ink-900" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2 w-4/5 rounded-full bg-white/15" />
            <div className="h-2 w-3/5 rounded-full bg-white/10" />
          </div>
          <div
            className="mt-auto h-8 rounded-xl"
            style={{ backgroundColor: hex }}
          />
        </div>
      </div>
    </div>
  );
}

/** Car with a QR windshield sticker — birlinq Move card visual (blue). */
export function CarVisual({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 96" className={className} aria-hidden focusable="false">
      {/* body */}
      <path
        d="M18 62c0-6 4-10 10-10l14-18c3-4 7-6 12-6h44c5 0 9 2 12 6l14 18c6 0 10 4 10 10v12c0 4-3 7-7 7H25c-4 0-7-3-7-7V62Z"
        fill="#151a26"
        stroke="#2b3143"
        strokeWidth="2"
      />
      {/* windows */}
      <path d="M48 34h28v16H36l12-16Z" fill="#0a0c13" />
      <path d="M84 34h26c2 0 4 1 5 3l10 13H84V34Z" fill="#0a0c13" />
      {/* wheels */}
      <circle cx="52" cy="81" r="11" fill="#0a0c13" stroke="#2b3143" strokeWidth="2" />
      <circle cx="52" cy="81" r="4" fill="#2b3143" />
      <circle cx="128" cy="81" r="11" fill="#0a0c13" stroke="#2b3143" strokeWidth="2" />
      <circle cx="128" cy="81" r="4" fill="#2b3143" />
      {/* taillight — brand blue (Move) */}
      <rect x="122" y="58" width="12" height="5" rx="2.5" fill="#2e63e0" />
      {/* QR sticker on the window */}
      <g transform="translate(56 30)">
        <rect x="0" y="0" width="26" height="26" rx="5" fill="#ffffff" />
        <QrInner x={4} y={4} s={18} />
      </g>
    </svg>
  );
}

/** Business card with QR — birlinq Business card visual (green). */
export function BusinessCardVisual({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 96" className={className} aria-hidden focusable="false">
      <rect
        x="22"
        y="14"
        width="136"
        height="72"
        rx="10"
        fill="#f8fafc"
        stroke="#d6dee9"
        strokeWidth="2"
      />
      <circle cx="46" cy="38" r="9" fill="#111b31" />
      <circle cx="43.5" cy="35.5" r="2" fill="#22c55e" />
      <rect x="62" y="31" width="46" height="6" rx="3" fill="#111827" opacity="0.85" />
      <rect x="62" y="42" width="32" height="5" rx="2.5" fill="#7b8495" />
      <rect x="36" y="60" width="52" height="5" rx="2.5" fill="#c7d0df" />
      <rect x="36" y="70" width="38" height="5" rx="2.5" fill="#c7d0df" />
      <g transform="translate(118 46)">
        <rect x="0" y="0" width="32" height="32" rx="6" fill="#111b31" />
        <QrInner x={5} y={5} s={22} light />
      </g>
    </svg>
  );
}

/** Round keychain tag with QR — birlinq ID card visual (violet). */
export function TagVisual({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 96" className={className} aria-hidden focusable="false">
      {/* key */}
      <g stroke="#2b3143" strokeWidth="4" strokeLinecap="round">
        <circle cx="38" cy="34" r="10" fill="none" />
        <path d="M46 41 70 65" />
        <path d="M60 55l7-7M67 62l7-7" />
      </g>
      {/* ring */}
      <circle cx="82" cy="72" r="9" fill="none" stroke="#2b3143" strokeWidth="3" />
      {/* tag */}
      <g transform="translate(94 22)">
        <rect x="0" y="0" width="60" height="60" rx="14" fill="#ffffff" stroke="#d6dee9" strokeWidth="2" />
        <circle cx="10" cy="10" r="3" fill="#c7d0df" />
        <QrInner x={13} y={13} s={36} />
        <rect x="18" y="52" width="24" height="3.5" rx="1.75" fill="#8b5cf6" />
      </g>
    </svg>
  );
}

/** Small QR block used inside the SVG visuals above. */
function QrInner({
  x,
  y,
  s,
  light = false,
}: {
  x: number;
  y: number;
  s: number;
  light?: boolean;
}) {
  const u = s / QR_SIZE;
  const fill = light ? "#ffffff" : "#111827";
  return (
    <g transform={`translate(${x} ${y})`} fill={fill}>
      {[
        [0, 0],
        [QR_SIZE - 7, 0],
        [0, QR_SIZE - 7],
      ].map(([fx, fy]) => (
        <g key={`${fx}-${fy}`}>
          <rect
            x={(fx + 0.5) * u}
            y={(fy + 0.5) * u}
            width={6 * u}
            height={6 * u}
            fill="none"
            stroke={fill}
            strokeWidth={u}
          />
          <rect x={(fx + 2) * u} y={(fy + 2) * u} width={3 * u} height={3 * u} />
        </g>
      ))}
      {QR_CELLS.filter((_, i) => i % 2 === 0).map(([r, c]) => (
        <rect key={`${r}-${c}`} x={c * u} y={r * u} width={u} height={u} />
      ))}
    </g>
  );
}

/** Soft ambient gradient blobs — restrained, blue/violet only (no red). */
export function GlowBlobs({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute -top-24 right-[-10%] size-[420px] rounded-full bg-brand-blue/10 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 size-[320px] rounded-full bg-sky-500/10 blur-3xl" />
      <div className="absolute bottom-[-15%] left-[-5%] size-[380px] rounded-full bg-brand-violet/10 blur-3xl" />
    </div>
  );
}
