import type { MetadataRoute } from "next";

/**
 * Installability is a push requirement, not a nice-to-have: on iOS the Push API
 * only exists once the site is launched from the Home Screen, and Safari will
 * not offer that without a manifest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "birlinq",
    short_name: "birlinq",
    description:
      "birlinq — умные QR-наклейки: свяжитесь с владельцем машины или вещи, не раскрывая личных данных.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#06070b",
    theme_color: "#06070b",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
