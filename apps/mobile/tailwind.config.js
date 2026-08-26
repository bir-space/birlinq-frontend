const { tailwindTheme } = require("@birlinq/tokens");

/**
 * NativeWind 4 is Tailwind v3, while the web is on v4 — so the theme arrives
 * as a JS object parsed out of the same `theme.css` the web imports directly.
 * One source, two engines.
 */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/*/src/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: { extend: tailwindTheme() },
  plugins: [],
};
