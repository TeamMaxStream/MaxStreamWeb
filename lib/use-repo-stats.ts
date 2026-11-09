"use client";

import { useEffect, useState } from "react";
import type { RepoStats } from "@/lib/github";
import { APP_VERSION } from "@/lib/github";

const REFRESH_MS = 5 * 60 * 1000;

/**
 * Starts from the server-rendered stats (so the numbers are right in the
 * initial HTML) and refreshes from /api/stats on mount and every few minutes.
 */
export function useRepoStats(initial: RepoStats) {
  const [stats, setStats] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as RepoStats;
        if (!cancelled) setStats(next);
      } catch {
        // Keep showing the last good numbers.
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    load();
    const interval = setInterval(load, REFRESH_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return stats;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString("en-US");
}
