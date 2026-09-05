import type { ReactNode } from "react";
import type { PartnerCode } from "@birlinq/api";

/**
 * Scopes the partner palette to a subtree. The tokens themselves live in
 * globals.css under `[data-partner="…"]`; this only stamps the attribute, so a
 * null partner renders the plain birlinq tree with no wrapper at all.
 */
export function PartnerTheme({
  partner,
  className = "",
  children,
}: {
  partner: PartnerCode | null;
  className?: string;
  children: ReactNode;
}) {
  if (!partner) return <div className={className}>{children}</div>;
  return (
    <div data-partner={partner} className={className}>
      {children}
    </div>
  );
}
