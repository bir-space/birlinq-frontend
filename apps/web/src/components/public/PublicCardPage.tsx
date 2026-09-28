"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { PublicTarget } from "@birlinq/api";
import { isCardTheme } from "@/components/card/themes";
import { PublicHeader, PublicLoading, PublicPage } from "./PublicPage";

/**
 * `/p/{alias}` — the card behind its link. `?theme=` previews the card in
 * another theme (the cabinet's "open with this theme" link); it is read
 * here, validated, and never stored. `useSearchParams` needs a Suspense
 * boundary above it, hence the split.
 */
export function PublicCardPage({ alias }: { alias: string }) {
  return (
    <Suspense fallback={<Fallback />}>
      <CardPage alias={alias} />
    </Suspense>
  );
}

function CardPage({ alias }: { alias: string }) {
  const params = useSearchParams();
  const raw = params.get("theme");
  const themeOverride = raw !== null && isCardTheme(raw) ? raw : null;
  const target = useMemo<PublicTarget>(() => ({ kind: "alias", alias }), [alias]);
  return <PublicPage target={target} themeOverride={themeOverride} />;
}

function Fallback() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-6 pt-5">
      <PublicHeader product={null} />
      <main className="flex flex-1 flex-col">
        <PublicLoading />
      </main>
    </div>
  );
}
