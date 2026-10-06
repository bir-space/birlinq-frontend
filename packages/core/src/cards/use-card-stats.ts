"use client";

import { useCallback, useEffect, useState } from "react";
import type { EntityStats } from "@birlinq/api";
import { useApi } from "@birlinq/platform";
import { splitClicks, type ClickSplit } from "./stats";

export interface UseCardStats {
  stats: EntityStats | null;
  /** `clicks_30d_by_channel` folded into calls / social / website / other. */
  clickSplit: ClickSplit | null;
  loading: boolean;
  error: boolean;
  retry: () => void;
}

/** GET /entities/{id}/stats — the 30-day figures of one card. */
export function useCardStats(id: string): UseCardStats {
  const api = useApi();

  const [stats, setStats] = useState<EntityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    void (async () => {
      try {
        const res = await api.entities.stats(id);
        if (cancelled) return;
        setStats(res.stats);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, id, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return {
    stats,
    clickSplit: stats ? splitClicks(stats.clicks_30d_by_channel) : null,
    loading,
    error,
    retry,
  };
}
