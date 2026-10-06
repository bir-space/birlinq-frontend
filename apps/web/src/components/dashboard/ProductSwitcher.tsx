"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useHref } from "@birlinq/platform";
import { PRODUCTS, PRODUCT_HOME, type Product } from "./products";

/** The product names are brand words — shown as they are in every locale. */
const NAMES: Record<Product, string> = {
  move: "Move",
  business: "Business",
};

/**
 * Move ⇄ Business, as a segmented pill at the head of the tab strip. The
 * active product is tinted with the brand accent rather than the white pill
 * the active *tab* gets, so the two levels of navigation read differently
 * at a glance. Each half is a plain link to the product's home: the shell
 * derives the product from the pathname, so nothing else has to change.
 */
export function ProductSwitcher({
  value,
  className = "",
}: {
  value: Product;
  className?: string;
}) {
  const t = useTranslations("dashboard.switcher");
  const href = useHref();

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={`inline-flex shrink-0 items-center rounded-full border border-line p-0.5 ${className}`}
    >
      {PRODUCTS.map((product) => {
        const active = product === value;
        return (
          <Link
            key={product}
            href={href(PRODUCT_HOME[product])}
            title={t(`${product}Hint`)}
            aria-current={active ? "true" : undefined}
            className={`rounded-full px-3 py-1 text-[12px] font-bold tracking-wide transition-colors ${
              active
                ? "bg-accent/15 text-accent"
                : "text-muted hover:bg-card hover:text-white"
            }`}
          >
            {NAMES[product]}
          </Link>
        );
      })}
    </div>
  );
}
