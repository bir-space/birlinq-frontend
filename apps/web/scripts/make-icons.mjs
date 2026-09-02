// Regenerates every raster/vector icon from the header mark's exact geometry
// (src/components/ui/LogoMark.tsx), so the favicon, the PWA icons and the
// notification icon are one logo and not three approximations of it.
//
// Run from apps/web:  node scripts/make-icons.mjs
//
// The gradient is declared in the mark's own 64×46 coordinate space and
// referenced from inside the transformed group: `userSpaceOnUse` resolves
// against the referencing element's user space, so declaring it in outer
// (512px) coordinates paints the whole mark with the first stop — which is how
// the previous icons came out flat blue.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const web = resolve(here, "..");

const BG = "#06070b";
const MARK_W = 64;
const MARK_H = 46;

/** Exactly LogoMark.tsx: b (ascender + bowl) mirrors q (bowl + descender). */
const MARK = `
  <rect x="4" y="2" width="9" height="32" rx="4.5" fill="url(#g)"/>
  <circle cx="21" cy="28" r="11" stroke="url(#g)" stroke-width="9" fill="none"/>
  <circle cx="43" cy="16" r="11" stroke="url(#g)" stroke-width="9" fill="none"/>
  <rect x="51" y="8" width="9" height="34" rx="4.5" fill="url(#g)"/>`;

const GRADIENT = `
  <linearGradient id="g" x1="0" y1="0" x2="${MARK_W}" y2="${MARK_H}" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="#2e63e0"/>
    <stop offset="55%" stop-color="#eef1fc"/>
    <stop offset="100%" stop-color="#8b5cf6"/>
  </linearGradient>`;

/**
 * Square icon with the mark centred at `fill` of the width. 0.62 keeps the
 * mark inside the maskable safe zone (central 80%) with room to spare.
 */
function squareSvg(size, { fill = 0.62, radius = 0 } = {}) {
  const scale = (size * fill) / MARK_W;
  const x = (size - MARK_W * scale) / 2;
  const y = (size - MARK_H * scale) / 2;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>${GRADIENT}
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="${BG}"/>
  <g transform="translate(${x} ${y}) scale(${scale})">${MARK}
  </g>
</svg>
`;
}

const targets = [
  ["public/icons/icon-512x512.png", 512],
  ["public/icons/icon-192x192.png", 192],
  ["public/apple-touch-icon.png", 180],
];

mkdirSync(resolve(web, "public/icons"), { recursive: true });

// Vector sources: the PWA one square and flat (masks are applied by the OS),
// the favicon with rounded corners because nothing rounds it for us.
writeFileSync(resolve(web, "public/icons/icon.svg"), squareSvg(512));
writeFileSync(
  resolve(web, "src/app/icon.svg"),
  squareSvg(64, { fill: 0.78, radius: 12 })
);

for (const [file, size] of targets) {
  const png = await sharp(Buffer.from(squareSvg(size)), { density: 384 })
    .resize(size, size)
    .png()
    .toBuffer();
  writeFileSync(resolve(web, file), png);
  console.log(`${file} ${size}px ${png.length} bytes`);
}
