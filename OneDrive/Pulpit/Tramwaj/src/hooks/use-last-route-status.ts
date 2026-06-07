import { useEffect, useState } from "react";
import type { ServiceAlert } from "@/data/gtfs-rt";

const STORAGE_PREFIX = "kacztransit-last-status:";
const MAX_AGE_MS = 24 * 60 * 60_000; // ignore snapshots older than 24h

export interface RouteStatusSnapshot {
  delay: number | null;
  alerts: ServiceAlert[];
  vehicleCount: number;
  savedAt: number;
}

function read(routeId: string | undefined): RouteStatusSnapshot | null {
  if (!routeId || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + routeId);
    if (!raw) return null;
    const snap = JSON.parse(raw) as RouteStatusSnapshot;
    if (!snap || typeof snap.savedAt !== "number") return null;
    if (Date.now() - snap.savedAt > MAX_AGE_MS) return null;
    return snap;
  } catch {
    return null;
  }
}

function write(routeId: string, snap: RouteStatusSnapshot) {
  try {
    localStorage.setItem(STORAGE_PREFIX + routeId, JSON.stringify(snap));
  } catch {
    /* quota or disabled */
  }
}

/**
 * Persists the most recent route status (delay, alerts, vehicle count) per route
 * to localStorage so it can be shown immediately after a page refresh,
 * before fresh GTFS-RT data arrives.
 *
 * - `cached` returns the stored snapshot for the current route (or null).
 * - When `live` data is provided (rtLoaded === true), it is written through.
 */
export function useLastRouteStatus(
  routeId: string | undefined,
  live: { delay: number | null; alerts: ServiceAlert[]; vehicleCount: number } | null,
  rtLoaded: boolean
) {
  const [cached, setCached] = useState<RouteStatusSnapshot | null>(() => read(routeId));

  // Reload cache on route change
  useEffect(() => {
    setCached(read(routeId));
  }, [routeId]);

  // Write through whenever fresh RT data is available
  useEffect(() => {
    if (!routeId || !rtLoaded || !live) return;
    const snap: RouteStatusSnapshot = {
      delay: live.delay,
      alerts: live.alerts,
      vehicleCount: live.vehicleCount,
      savedAt: Date.now(),
    };
    write(routeId, snap);
    setCached(snap);
  }, [routeId, rtLoaded, live?.delay, live?.alerts, live?.vehicleCount]);

  return cached;
}
