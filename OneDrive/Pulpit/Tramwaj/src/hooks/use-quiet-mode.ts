import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "kacztransit-quiet-mode:";

interface QuietState {
  /** epoch ms until which mute is active; 0 = off; Infinity (stored as -1) = until manual unmute */
  until: number;
}

function readState(routeId: string | undefined): QuietState {
  if (!routeId) return { until: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + routeId);
    if (!raw) return { until: 0 };
    const parsed = JSON.parse(raw) as QuietState;
    return { until: parsed.until === -1 ? Infinity : parsed.until || 0 };
  } catch {
    return { until: 0 };
  }
}

function writeState(routeId: string, s: QuietState) {
  try {
    localStorage.setItem(
      STORAGE_PREFIX + routeId,
      JSON.stringify({ until: s.until === Infinity ? -1 : s.until })
    );
  } catch {
    /* noop */
  }
}

/**
 * Per-route notification quiet mode. Persists to localStorage.
 * `muted` reflects current state; auto-expires when `until` passes.
 */
export function useQuietMode(routeId: string | undefined) {
  const [until, setUntil] = useState<number>(() => readState(routeId).until);

  // Reload on route change
  useEffect(() => {
    setUntil(readState(routeId).until);
  }, [routeId]);

  // Auto-expire timer
  useEffect(() => {
    if (!routeId || until === 0 || until === Infinity) return;
    const ms = until - Date.now();
    if (ms <= 0) {
      setUntil(0);
      writeState(routeId, { until: 0 });
      return;
    }
    const t = window.setTimeout(() => {
      setUntil(0);
      writeState(routeId, { until: 0 });
    }, ms);
    return () => window.clearTimeout(t);
  }, [routeId, until]);

  const muted = until === Infinity || (until > 0 && until > Date.now());

  const muteFor = useCallback(
    (ms: number | "forever") => {
      if (!routeId) return;
      const next = ms === "forever" ? Infinity : Date.now() + ms;
      setUntil(next);
      writeState(routeId, { until: next });
    },
    [routeId]
  );

  const unmute = useCallback(() => {
    if (!routeId) return;
    setUntil(0);
    writeState(routeId, { until: 0 });
  }, [routeId]);

  const toggle = useCallback(() => {
    if (muted) unmute();
    else muteFor("forever");
  }, [muted, unmute, muteFor]);

  return { muted, until, muteFor, unmute, toggle };
}
