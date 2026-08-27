"use client";

import { useCallback, useEffect, useState } from "react";
import type { Interaction, OwnerDashboard } from "@birlinq/api";
import { useApi } from "@birlinq/platform";

const LATEST_LIMIT = 5;

export interface UseOverview {
  stats: OwnerDashboard | null;
  latest: Interaction[];
  loading: boolean;
  error: boolean;
  retry: () => void;
}

/**
 * The cabinet's summary.
 *
 * Every figure comes from GET /owner/dashboard, which aggregates them with
 * indexed COUNTs server-side. Deriving them from GET /qr instead — as the web
 * page did while the owner cabinet was unimplemented — would page through every
 * QR code just to add up `scan_count`, and still could not produce the 7/30-day
 * windows or the unresolved count.
 */
export function useOverview(): UseOverview {
  const api = useApi();

  const [stats, setStats] = useState<OwnerDashboard | null>(null);
  const [latest, setLatest] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    void (async () => {
      try {
        const [dash, inter] = await Promise.all([
          api.owner.dashboard(),
          api.owner.interactions({ limit: LATEST_LIMIT }),
        ]);
        if (cancelled) return;
        setStats(dash);
        setLatest(inter.data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { stats, latest, loading, error, retry };
}
