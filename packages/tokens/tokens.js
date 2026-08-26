const fs = require("node:fs");
const path = require("node:path");

/**
 * One source of truth for the design tokens, read by two Tailwind majors.
 *
 * The web is on Tailwind v4, where the theme is CSS (`@theme` in theme.css).
 * NativeWind 4 is on Tailwind v3, where the theme is a JS object. Rather than
 * keep two hand-written copies in step — which is exactly how a token drifts —
 * the CSS stays authoritative and this parses it into the v3 shape.
 *
 * That keeps `CONVENTIONS.md` true: theme.css is still where a designer edits
 * a colour, and nothing has to be regenerated after they do.
 */

const THEME_PATH = path.join(__dirname, "theme.css");

/** `--name: value;` pairs inside the `@theme { ... }` block, values may wrap lines. */
function readCustomProperties() {
  const css = fs.readFileSync(THEME_PATH, "utf8");
  const block = css.match(/@theme\s*\{([\s\S]*)\}/);
  if (block === null) {
    throw new Error(`No @theme block found in ${THEME_PATH}`);
  }

  const withoutComments = block[1].replace(/\/\*[\s\S]*?\*\//g, "");
  const properties = {};
  for (const [, name, value] of withoutComments.matchAll(
    /--([a-z0-9-]+)\s*:\s*([^;]+);/gi
  )) {
    properties[name] = value.trim().replace(/\s+/g, " ");
  }
  return properties;
}

/** `var(--color-brand-blue)` → the value that token holds. */
function resolveReferences(properties) {
  const resolved = {};
  for (const name of Object.keys(properties)) {
    let value = properties[name];
    // Bounded rather than recursive: a token chain deeper than this is a
    // mistake worth failing on, and a cycle would otherwise hang the build.
    for (let pass = 0; pass < 5 && value.includes("var(--"); pass += 1) {
      value = value.replace(
        /var\(--([a-z0-9-]+)\)/gi,
        (whole, ref) => properties[ref] ?? whole
      );
    }
    resolved[name] = value;
  }
  return resolved;
}

/**
 * The `theme.extend` object for a Tailwind v3 config, following v4's naming
 * convention: `--color-*` are colours, `--radius-*` radii, `--font-*` families.
 */
function tailwindTheme() {
  const properties = resolveReferences(readCustomProperties());

  const colors = {};
  const borderRadius = {};
  const fontFamily = {};

  for (const [name, value] of Object.entries(properties)) {
    if (name.startsWith("color-")) {
      colors[name.slice("color-".length)] = value;
    } else if (name.startsWith("radius-")) {
      borderRadius[name.slice("radius-".length)] = value;
    } else if (name.startsWith("font-")) {
      fontFamily[name.slice("font-".length)] = value
        .split(",")
        .map((face) => face.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }
  }

  return { colors, borderRadius, fontFamily };
}

module.exports = { tailwindTheme, readCustomProperties, resolveReferences };
