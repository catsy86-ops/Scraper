import { useEffect, useState } from "react";

export interface DelaySample {
  t: number; // timestamp ms
  d: number; // delay seconds (avg)
}

const KEY_PREFIX = "kt:delay-history:";
const MAX_SAMPLES = 120; // ~1h at 30s interval
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

function load(routeId: string): DelaySample[] {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + routeId);
    if (!raw) return [];
    const arr = JSON.parse(raw) as DelaySample[];
    const cutoff = Date.now() - MAX_AGE_MS;
    return arr.filter((s) => s.t >= cutoff);
  } catch {
    return [];
  }
}

function save(routeId: string, samples: DelaySample[]) {
  try {
    localStorage.setItem(KEY_PREFIX + routeId, JSON.stringify(samples));
  } catch {
    /* quota */
  }
}

/**
 * Records the latest delay (seconds) for a route into localStorage history.
 * Returns the cumulative samples (oldest → newest).
 */
export function useDelayHistory(routeId: string | undefined, currentDelay: number | null) {
  const [samples, setSamples] = useState<DelaySample[]>(() => (routeId ? load(routeId) : []));

  useEffect(() => {
    if (!routeId) return;
    setSamples(load(routeId));
  }, [routeId]);

  useEffect(() => {
    if (!routeId || currentDelay === null) return;
    setSamples((prev) => {
      const last = prev[prev.length - 1];
      const now = Date.now();
      // Skip if recorded within last 20s (avoid duplicates from re-renders)
      if (last && now - last.t < 8_000) return prev;
      const next = [...prev, { t: now, d: currentDelay }].slice(-MAX_SAMPLES);
      save(routeId, next);
      return next;
    });
  }, [routeId, currentDelay]);

  const clear = () => {
    if (!routeId) return;
    localStorage.removeItem(KEY_PREFIX + routeId);
    setSamples([]);
  };

  return { samples, clear };
}
