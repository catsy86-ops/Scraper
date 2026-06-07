/**
 * Hook that wraps the route planner engine with state management,
 * real-time data fetching, explicit search triggering, and live countdown ticking.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { GtfsRoute } from "@/data/gtfs";
import { fetchGtfsRt, type GtfsRtData } from "@/data/gtfs-rt";
import { planJourneys, type PlannerResult } from "@/lib/route-planner";

interface UseRoutePlannerOptions {
  routes: GtfsRoute[];
  allStops: string[];
}

interface StopCoord {
  lat: number;
  lon: number;
}

export function useRoutePlanner({ routes, allStops }: UseRoutePlannerOptions) {
  const [fromStop, setFromStop] = useState<string | null>(null);
  const [toStop, setToStop] = useState<string | null>(null);
  const [departureTime, setDepartureTime] = useState<"now" | string>("now");
  const [rtData, setRtData] = useState<GtfsRtData | null>(null);
  const [rtLoading, setRtLoading] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Track previous RT data version to refresh results on new RT data
  const lastRtTimestamp = useRef<number>(0);

  // --- Real-time data ---
  const refreshRt = useCallback(async () => {
    setRtLoading(true);
    try {
      const rt = await fetchGtfsRt();
      setRtData(rt);
      return rt;
    } catch {
      // silent fail — RT is best-effort
      return null;
    } finally {
      setRtLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRt();
    const interval = setInterval(refreshRt, 30_000);
    return () => clearInterval(interval);
  }, [refreshRt]);

  // Tick for live countdowns
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  // Auto-refresh results when RT data updates (if a search was already performed)
  useEffect(() => {
    if (!rtData || !hasSearched || !fromStop || !toStop) return;
    const ts = rtData.lastUpdated.getTime();
    if (ts !== lastRtTimestamp.current) {
      lastRtTimestamp.current = ts;
      const newResult = planJourneys(routes, fromStop, toStop, departureTime, rtData);
      setResult(newResult);
    }
  }, [rtData, hasSearched, fromStop, toStop, routes, departureTime]);

  // --- Stop coordinates map (for geolocation) ---
  const stopCoords = useMemo(() => {
    const m = new Map<string, StopCoord>();
    for (const r of routes) {
      for (const s of r.stops) {
        if (!m.has(s.n) && Number.isFinite(s.la) && Number.isFinite(s.lo)) {
          m.set(s.n, { lat: s.la, lon: s.lo });
        }
      }
    }
    return m;
  }, [routes]);

  // --- Explicit search action ---
  const search = useCallback(async () => {
    if (!fromStop || !toStop) return;
    setSearching(true);
    setHasSearched(true);

    // Fetch fresh RT data before planning
    let freshRt = rtData;
    try {
      const rt = await fetchGtfsRt();
      setRtData(rt);
      freshRt = rt;
      lastRtTimestamp.current = rt.lastUpdated.getTime();
    } catch {
      // proceed with existing RT data
    }

    const planResult = planJourneys(routes, fromStop, toStop, departureTime, freshRt);
    setResult(planResult);
    setSearching(false);
  }, [fromStop, toStop, routes, departureTime, rtData]);

  // --- Actions ---
  const swapStops = useCallback(() => {
    setFromStop((prev) => {
      const oldTo = toStop;
      setToStop(prev);
      return oldTo;
    });
    // Clear results when swapping — require re-search
    setResult(null);
    setHasSearched(false);
  }, [toStop]);

  const clearSearch = useCallback(() => {
    setFromStop(null);
    setToStop(null);
    setResult(null);
    setHasSearched(false);
  }, []);

  // --- Geolocation helpers ---
  const distM = useCallback(
    (a: StopCoord, b: StopCoord) => {
      const R = 6371000;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dLat = toRad(b.lat - a.lat);
      const dLon = toRad(b.lon - a.lon);
      const s =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(s));
    },
    [],
  );

  const findNearestStop = useCallback(
    (pos: StopCoord): { name: string; distance: number } | null => {
      let best: { name: string; distance: number } | null = null;
      stopCoords.forEach((c, name) => {
        const d = distM(pos, c);
        if (!best || d < best.distance) {
          best = { name, distance: d };
        }
      });
      return best;
    },
    [stopCoords, distM],
  );

  // --- Current time string ---
  const currentTimeStr = useMemo(() => {
    if (departureTime !== "now") return departureTime;
    const now = new Date(nowTick);
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }, [departureTime, nowTick]);

  // Can search?
  const canSearch = !!fromStop && !!toStop && !searching;

  return {
    // State
    fromStop,
    toStop,
    departureTime,
    rtData,
    rtLoading,
    nowTick,
    currentTimeStr,
    result,
    searching,
    hasSearched,
    canSearch,
    // Setters
    setFromStop,
    setToStop,
    setDepartureTime,
    // Actions
    search,
    swapStops,
    clearSearch,
    refreshRt,
    // Geo helpers
    stopCoords,
    findNearestStop,
    distM,
  };
}
