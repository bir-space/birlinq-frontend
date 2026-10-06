"use client";

import { useCallback, useEffect, useState } from "react";
import type { Entity, EntityStats } from "@birlinq/api";
import { useApi } from "@birlinq/platform";
import { EMPTY_TOTALS, sumStats, type StatsTotals } from "./stats";
import { CARDS_PAGE_SIZE, nextHasMore } from "./use-cards";

export interface UseBusinessOverview {
  /** The first page of cards, newest first. */
  cards: Entity[];
  /** More cards exist beyond that page; `totals` cover only what is loaded. */
  hasMoreCards: boolean;
  /** Per card, for the ones whose stats call succeeded. */
  statsById: Record<string, EntityStats>;
  /** 30-day figures of every card in `statsById`, added up. */
  totals: StatsTotals;
  /** The stats of some cards failed to load; the page renders with the rest. */
  partial: boolean;
  loading: boolean;
  error: boolean;
  retry: () => void;
}

/**
 * The Business cabinet summary.
 *
 * There is no owner-level aggregate endpoint yet, so this is the first page
 * of cards plus one `stats` call per card, settled together: a card whose
 * figures fail to arrive is shown without them rather than failing the page.
 */
export function useBusinessOverview(): UseBusinessOverview {
  const api = useApi();

  const [cards, setCards] = useState<Entity[]>([]);
  const [hasMoreCards, setHasMoreCards] = useState(false);
  const [statsById, setStatsById] = useState<Record<string, EntityStats>>({});
  const [totals, setTotals] = useState<StatsTotals>(EMPTY_TOTALS);
  const [partial, setPartial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    void (async () => {
      try {
        const page = await api.entities.list({
          type: "personal",
          limit: CARDS_PAGE_SIZE,
        });
        if (cancelled) return;
        const results = await Promise.allSettled(
          page.data.map((card) => api.entities.stats(card.id))
        );
        if (cancelled) return;
        const byId: Record<string, EntityStats> = {};
        let failed = false;
        results.forEach((res, i) => {
          if (res.status === "fulfilled") byId[page.data[i].id] = res.value.stats;
          else failed = true;
        });
        setCards(page.data);
        setHasMoreCards(nextHasMore(page.meta));
        setStatsById(byId);
        setTotals(sumStats(Object.values(byId)));
        setPartial(failed);
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

  return {
    cards,
    hasMoreCards,
    statsById,
    totals,
    partial,
    loading,
    error,
    retry,
  };
}
