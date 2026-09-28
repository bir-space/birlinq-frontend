/**
 * The two products one cabinet serves (FE-011): Move — stickers on cars —
 * and Business — digital cards. They share the session, the header and the
 * profile page; only the tab strip changes. Which product is showing is
 * read off the pathname, and the last one seen is remembered so a neutral
 * page (the profile) and the login redirect can still take a side.
 */

export type Product = "move" | "business";

/** Switcher order. Names are brand words and are never translated. */
export const PRODUCTS = ["move", "business"] as const satisfies readonly Product[];

/** Where the logo and the switcher lead for each product. */
export const PRODUCT_HOME: Record<Product, string> = {
  move: "/dashboard",
  business: "/dashboard/business",
};

export interface DashboardTab {
  href: string;
  /** Key under `dashboard.nav`. */
  key: string;
  /** Match the pathname exactly rather than by prefix — for the product home. */
  exact: boolean;
}

export const TABS: Record<Product, readonly DashboardTab[]> = {
  move: [
    { href: "/dashboard", key: "overview", exact: true },
    { href: "/dashboard/interactions", key: "interactions", exact: false },
    { href: "/dashboard/qr", key: "qr", exact: false },
  ],
  business: [
    { href: "/dashboard/business", key: "businessOverview", exact: true },
    { href: "/dashboard/cards", key: "cards", exact: false },
    { href: "/dashboard/pricing", key: "pricing", exact: false },
  ],
};

/** The one cabinet page that belongs to neither product. */
export const PROFILE_PATH = "/dashboard/profile";

const BUSINESS_PREFIXES = ["/dashboard/business", "/dashboard/cards", "/dashboard/pricing"];

function underPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/**
 * Which product a cabinet path belongs to, or null for a neutral one (the
 * profile) and for anything outside the cabinet. `rel` is the pathname with
 * the platform's base path (`/mock`) already stripped.
 */
export function productFromPath(rel: string): Product | null {
  const path = rel.replace(/\/+$/, "") || "/";
  if (BUSINESS_PREFIXES.some((prefix) => underPrefix(path, prefix))) {
    return "business";
  }
  if (underPrefix(path, PROFILE_PATH)) return null;
  if (underPrefix(path, "/dashboard")) return "move";
  return null;
}

/** `localStorage` key of the last product the owner was looking at. */
export const PRODUCT_STORAGE_KEY = "birlinq.product";

function isProduct(value: unknown): value is Product {
  return value === "move" || value === "business";
}

/**
 * The remembered product, or null when nothing is stored or storage is
 * unavailable (private mode, a blocked origin, the server). Only ever a hint
 * — it decides a highlight and a link target, never a redirect.
 */
export function readRememberedProduct(): Product | null {
  try {
    const stored = window.localStorage.getItem(PRODUCT_STORAGE_KEY);
    return isProduct(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function rememberProduct(product: Product): void {
  try {
    window.localStorage.setItem(PRODUCT_STORAGE_KEY, product);
  } catch {
    // Storage is a convenience; losing the hint changes nothing that matters.
  }
}
