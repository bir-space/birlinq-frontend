"use client";

import { useMemo } from "react";
import type { PublicTarget } from "@birlinq/api";
import { PublicPage } from "./PublicPage";

/**
 * `/q/{code}` — the sticker door. Everything lives in `PublicPage`; this
 * keeps the name the route pages import.
 */
export function PublicScanPage({ code }: { code: string }) {
  const target = useMemo<PublicTarget>(() => ({ kind: "qr", code }), [code]);
  return <PublicPage target={target} />;
}
