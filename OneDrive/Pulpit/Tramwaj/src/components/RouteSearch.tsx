import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Search, ArrowUpDown, TrainFront, Bus, X, MapPin, Navigation, Clock,
  ArrowRight, Radio, Gauge, History, Trash2, Locate, ChevronRight,
  Timer, Footprints, ArrowDown
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import type { GtfsRoute } from "@/data/gtfs";
import {
  fetchGtfsRt, getRouteDelay, getRouteVehicles, getRouteAlerts,
  findTripForDeparture, getTripDelay, findVehicleForTrip,
  type GtfsRtData,
} from "@/data/gtfs-rt";
import { useSearchHistory } from "@/hooks/use-search-history";
import LiveFreshnessBadge from "@/components/LiveFreshnessBadge";

interface RouteSearchProps {
  routes: GtfsRoute[];
  allStops: string[];
  onRouteSelect: (route: GtfsRoute) => void;
}

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.15 } },
};

const sectionVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto", transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" },
  }),
  exit: { opacity: 0, x: 12, transition: { duration: 0.15 } },
};

const RouteSearch = ({ routes, allStops, onRouteSelect }: RouteSearchProps) => {
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [fromStop, setFromStop] = useState<string | null>(null);
  const [toStop, setToStop] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<"from" | "to" | null>(null);
  const [rtData, setRtData] = useState<GtfsRtData | null>(null);
  const [rtLoading, setRtLoading] = useState(false);
  const [departureTime, setDepartureTime] = useState<"now" | string>("now");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [geoLoading, setGeoLoading] = useState<"from" | "to" | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);
  const [nearestInfo, setNearestInfo] = useState<{ field: "from" | "to"; stop: string; distance: number } | null>(null);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  const { history, addEntry, removeEntry, clearHistory } = useSearchHistory();

  // Stop name → coords (first occurrence wins) — used for "Use my location" nearest-stop lookup.
  const stopCoords = useMemo(() => {
    const m = new Map<string, { lat: number; lon: number }>();
    for (const r of routes) {
      for (const s of r.stops) {
        if (!m.has(s.n) && Number.isFinite(s.la) && Number.isFinite(s.lo)) {
          m.set(s.n, { lat: s.la, lon: s.lo });
        }
      }
    }
    return m;
  }, [routes]);

  const distM = useCallback((a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }, []);

  const findNearestStops = useCallback(
    (pos: { lat: number; lon: number }, limit = 6) => {
      const arr: { name: string; d: number }[] = [];
      stopCoords.forEach((c, name) => arr.push({ name, d: distM(pos, c) }));
      arr.sort((a, b) => a.d - b.d);
      return arr.slice(0, limit);
    },
    [stopCoords, distM],
  );

  const useMyLocation = useCallback(
    (field: "from" | "to") => {
      if (!("geolocation" in navigator)) {
        setGeoError("Geolokalizacja niedostępna w tej przeglądarce");
        return;
      }
      setGeoError(null);
      setGeoLoading(field);
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const pos = { lat: p.coords.latitude, lon: p.coords.longitude };
          setUserPos(pos);
          const [nearest] = findNearestStops(pos, 1);
          if (!nearest) { setGeoError("Brak przystanków w pobliżu"); setGeoLoading(null); return; }
          if (field === "from") {
            setFromStop(nearest.name); setFromQuery(nearest.name); setFocusedField(null);
            if (toStop) addEntry(nearest.name, toStop);
            setTimeout(() => toRef.current?.focus(), 100);
          } else {
            setToStop(nearest.name); setToQuery(nearest.name); setFocusedField(null);
            if (fromStop) addEntry(fromStop, nearest.name);
          }
          setNearestInfo({ field, stop: nearest.name, distance: nearest.d });
          setGeoLoading(null);
        },
        (err) => {
          setGeoError(
            err.code === err.PERMISSION_DENIED ? "Brak zgody na lokalizację"
              : err.code === err.TIMEOUT ? "Przekroczono czas oczekiwania"
              : "Nie udało się pobrać lokalizacji",
          );
          setGeoLoading(null);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
      );
    },
    [findNearestStops, fromStop, toStop, addEntry],
  );

  const formatDistance = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`);

  const refreshRt = useCallback(async () => {
    setRtLoading(true);
    try {
      const rt = await fetchGtfsRt();
      setRtData(rt);
    } catch {}
    finally { setRtLoading(false); }
  }, []);

  useEffect(() => {
    refreshRt();
    const interval = setInterval(refreshRt, 30_000);
    return () => clearInterval(interval);
  }, [refreshRt]);

  // Live "now" tick — drives countdowns and "departs in X min" without refetching RT.
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const normalize = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filteredFromStops = useMemo(() => {
    if (fromQuery.length < 2) return [];
    const q = normalize(fromQuery);
    return allStops
      .filter((s) => normalize(s).includes(q))
      .sort((a, b) => {
        const an = normalize(a), bn = normalize(b);
        return (an.startsWith(q) ? 0 : 1) - (bn.startsWith(q) ? 0 : 1) || an.localeCompare(bn);
      })
      .slice(0, 8);
  }, [fromQuery, allStops]);

  const filteredToStops = useMemo(() => {
    if (toQuery.length < 2) return [];
    const q = normalize(toQuery);
    return allStops
      .filter((s) => normalize(s).includes(q))
      .sort((a, b) => {
        const an = normalize(a), bn = normalize(b);
        return (an.startsWith(q) ? 0 : 1) - (bn.startsWith(q) ? 0 : 1) || an.localeCompare(bn);
      })
      .slice(0, 8);
  }, [toQuery, allStops]);

  const currentTimeStr = useMemo(() => {
    if (departureTime !== "now") return departureTime;
    const now = new Date(nowTick);
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }, [departureTime, nowTick]);

  const results = useMemo(() => {
    if (!fromStop || !toStop) return [];
    return routes
      .filter((route) => {
        const stopNames = route.stops.map((s) => s.n.toLowerCase());
        const fromBase = fromStop?.toLowerCase().replace(/\s+\d+$/, "");
        const toBase = toStop?.toLowerCase().replace(/\s+\d+$/, "");
        const fromMatch = !fromBase || stopNames.some((n) => n.replace(/\s+\d+$/, "") === fromBase);
        const toMatch = !toBase || stopNames.some((n) => n.replace(/\s+\d+$/, "") === toBase);
        if (!fromMatch || !toMatch) return false;
        if (fromBase && toBase) {
          const fromIdx = stopNames.findIndex((n) => n.replace(/\s+\d+$/, "") === fromBase);
          const toIdx = stopNames.findIndex((n) => n.replace(/\s+\d+$/, "") === toBase);
          return fromIdx < toIdx;
        }
        return true;
      })
      .map((route) => {
        const stopNames = route.stops.map((s) => s.n.toLowerCase());
        const fromBase = fromStop?.toLowerCase().replace(/\s+\d+$/, "");
        const toBase = toStop?.toLowerCase().replace(/\s+\d+$/, "");
        const fromIdx = fromBase ? stopNames.findIndex((n) => n.replace(/\s+\d+$/, "") === fromBase) : 0;
        const toIdx = toBase ? stopNames.findIndex((n) => n.replace(/\s+\d+$/, "") === toBase) : stopNames.length - 1;

        const fromStopData = fromIdx >= 0 ? route.stops[fromIdx] : null;
        const toStopData = toIdx >= 0 ? route.stops[toIdx] : null;

        // Compute real journey legs from GTFS: pair each fromDep with the earliest
        // toDep that's after it (and within a sane window). This produces the
        // actual travel time per trip instead of a hard-coded 2 min/stop estimate.
        const toMins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
        const fromMins = toMins(currentTimeStr);
        const legs: { dep: string; arr: string; minutes: number }[] = [];
        if (fromStopData && toStopData) {
          for (const dep of fromStopData.d) {
            const depM = toMins(dep);
            if (depM < fromMins) continue;
            const arr = toStopData.d.find((a) => {
              const arrM = toMins(a);
              return arrM > depM && arrM - depM <= 180;
            });
            if (arr) legs.push({ dep, arr, minutes: toMins(arr) - depM });
            if (legs.length >= 4) break;
          }
        }
        const nextDepartures = legs.map((l) => l.dep);
        const arrivalDep = legs[0]?.arr ?? null;
        const estimatedMinutes = legs[0]?.minutes ?? 0;

        // Per-trip RT: match the first leg's scheduled startTime to a TripUpdate
        // → exact delay, and resolve a live vehicle for that very trip.
        const matchedTrip = rtData && legs[0]
          ? findTripForDeparture(route.id, legs[0].dep, rtData.tripUpdates)
          : null;
        const tripDelay = getTripDelay(matchedTrip);
        const routeAvgDelay = rtData ? getRouteDelay(route.id, rtData.tripUpdates) : null;
        // Prefer per-trip delay; fall back to route average so users still see RT signal.
        const delay = tripDelay ?? routeAvgDelay;
        const vehicle = rtData
          ? findVehicleForTrip(matchedTrip?.tripId, route.id, rtData.vehicles)
          : null;
        const vehicleCount = rtData ? getRouteVehicles(route.id, rtData.vehicles).length : 0;
        const alerts = rtData ? getRouteAlerts(route.id, rtData.alerts) : [];

        const stopsCount = Math.abs(toIdx - fromIdx);

        return {
          route, stopsCount, fromIdx, toIdx,
          nextDepartures, arrivalDep, delay, vehicle, vehicleCount, alerts, estimatedMinutes,
          isLiveTrip: !!matchedTrip,
        };
      })
      .sort((a, b) => {
        // Effective departure = scheduled + delay (in minutes). Falls back to
        // scheduled when RT delay is unavailable. Missing departures sink last.
        const eff = (r: typeof a) => {
          const dep = r.nextDepartures[0];
          if (!dep) return Number.POSITIVE_INFINITY;
          const [h, m] = dep.split(":").map(Number);
          return h * 60 + m + (r.delay ? Math.round(r.delay / 60) : 0);
        };
        const ae = eff(a), be = eff(b);
        if (ae !== be) return ae - be;
        // Tie-breakers: prefer live-matched trips, then fewer stops.
        if (a.isLiveTrip !== b.isLiveTrip) return a.isLiveTrip ? -1 : 1;
        return a.stopsCount - b.stopsCount;
      })
      .slice(0, 10);
  }, [fromStop, toStop, routes, rtData, currentTimeStr]);

  const swapStops = () => {
    setFromQuery(toQuery);
    setToQuery(fromQuery);
    setFromStop(toStop);
    setToStop(fromStop);
  };

  const selectFrom = (stop: string) => {
    setFromStop(stop);
    setFromQuery(stop);
    setFocusedField(null);
    if (toStop) addEntry(stop, toStop);
    setTimeout(() => toRef.current?.focus(), 100);
  };

  const selectTo = (stop: string) => {
    setToStop(stop);
    setToQuery(stop);
    setFocusedField(null);
    if (fromStop) addEntry(fromStop, stop);
  };

  const loadFromHistory = (from: string, to: string) => {
    setFromQuery(from);
    setToQuery(to);
    setFromStop(from);
    setToStop(to);
  };

  const clearSearch = () => {
    setFromQuery(""); setToQuery(""); setFromStop(null); setToStop(null);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query || query.length < 2) return text;
    const normText = normalize(text);
    const normQuery = normalize(query);
    const idx = normText.indexOf(normQuery);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-semibold text-primary">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  function formatDelay(seconds: number): string {
    if (seconds <= 30) return "punktualnie";
    return `+${Math.round(seconds / 60)} min`;
  }

  const hasResults = fromStop && toStop;
  const hasPartialInput = (fromStop && !toStop) || (!fromStop && toStop);

  // Build per-field dropdown content. When query is short, surface "Use my location"
  // + nearest stops (if we already have a geo fix) instead of an empty list.
  const buildSuggestions = (field: "from" | "to", query: string, filtered: string[]) => {
    if (query.length >= 2) return { mode: "search" as const, stops: filtered };
    const nearby = userPos ? findNearestStops(userPos, 5) : [];
    return { mode: "nearby" as const, stops: nearby };
  };
  const fromSuggestions = buildSuggestions("from", fromQuery, filteredFromStops);
  const toSuggestions = buildSuggestions("to", toQuery, filteredToStops);

  // Determine current state for AnimatePresence
  const currentState = hasResults ? "results" : hasPartialInput ? "partial" : "empty";


  return (
    <section id="rozklady" className="container mx-auto px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center gap-3 mb-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground">
            <Navigation size={20} />
          </div>
          <div>
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground leading-tight">Wyszukaj połączenie</h2>
            <p className="text-xs text-muted-foreground">Znajdź najlepszą trasę komunikacją miejską</p>
          </div>
        </motion.div>

        {/* Search Card */}
        <motion.div
          className="bg-card rounded-2xl border shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          {/* Input area */}
          <div className="p-4 md:p-5">
            <div className="flex gap-3">
              {/* Timeline dots */}
              <div className="flex flex-col items-center pt-3 pb-1">
                <motion.div
                  className="w-3.5 h-3.5 rounded-full bg-accent border-2 border-accent shrink-0"
                  animate={fromStop ? { scale: [1, 1.3, 1], boxShadow: "0 0 0 4px hsl(var(--accent) / 0.2)" } : { scale: 1, boxShadow: "0 0 0 0px transparent" }}
                  transition={{ duration: 0.4 }}
                />
                <motion.div
                  className="w-0.5 bg-border my-1 min-h-[24px]"
                  style={{ flex: 1 }}
                  animate={{ opacity: hasResults ? 1 : 0.5 }}
                  transition={{ duration: 0.4 }}
                />
                <motion.div
                  className="w-3.5 h-3.5 rounded-full bg-destructive border-2 border-destructive shrink-0"
                  animate={toStop ? { scale: [1, 1.3, 1], boxShadow: "0 0 0 4px hsl(var(--destructive) / 0.2)" } : { scale: 1, boxShadow: "0 0 0 0px transparent" }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              {/* Input fields */}
              <div className="flex-1 space-y-2 min-w-0">
                {/* From */}
                <div className="relative">
                  <motion.input
                    ref={fromRef}
                    type="text"
                    value={fromQuery}
                    onChange={(e) => { setFromQuery(e.target.value); setFromStop(null); }}
                    onFocus={() => setFocusedField("from")}
                    onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                    placeholder="Skąd jedziesz?"
                    className={`w-full bg-muted/50 rounded-xl pl-4 pr-16 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none text-sm transition-all border-2 ${
                      fromStop
                        ? "border-accent/30 bg-accent/5"
                        : focusedField === "from"
                        ? "border-primary/40 bg-background"
                        : "border-transparent"
                    }`}
                    layout
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    <AnimatePresence>
                      {fromQuery && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          onMouseDown={(e) => { e.preventDefault(); setFromQuery(""); setFromStop(null); fromRef.current?.focus(); }}
                          className="text-muted-foreground/50 hover:text-foreground transition-colors p-1.5"
                          aria-label="Wyczyść pole"
                        >
                          <X size={14} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); useMyLocation("from"); }}
                      disabled={geoLoading !== null}
                      className={`p-1.5 rounded-md transition-colors ${
                        geoLoading === "from"
                          ? "text-primary animate-pulse"
                          : "text-muted-foreground/60 hover:text-primary hover:bg-primary/5"
                      }`}
                      aria-label="Użyj mojej lokalizacji jako początek"
                      title="Użyj mojej lokalizacji"
                    >
                      <Locate size={15} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {focusedField === "from" && (fromSuggestions.mode === "nearby" || fromSuggestions.stops.length > 0) && (
                      <motion.ul
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute z-40 left-0 right-0 bg-popover border border-border rounded-xl mt-1.5 shadow-2xl max-h-72 overflow-y-auto"
                      >
                        {fromSuggestions.mode === "nearby" && (
                          <li>
                            <button
                              onMouseDown={(e) => { e.preventDefault(); useMyLocation("from"); }}
                              className="w-full text-left px-4 py-3 hover:bg-primary/5 text-sm text-foreground transition-colors flex items-center gap-3 border-b border-border/30"
                            >
                              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary">
                                <Locate size={13} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">Moja lokalizacja</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {geoLoading === "from" ? "Wyszukuję najbliższy przystanek…" : userPos ? "Najbliższy przystanek wg GPS" : "Kliknij, aby pobrać GPS"}
                                </p>
                              </div>
                            </button>
                          </li>
                        )}
                        {fromSuggestions.mode === "nearby" && userPos && fromSuggestions.stops.length > 0 && (
                          <li className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60 bg-muted/30">
                            Przystanki w pobliżu
                          </li>
                        )}
                        {fromSuggestions.stops.map((entry, i) => {
                          const name = typeof entry === "string" ? entry : entry.name;
                          const dist = typeof entry === "string" ? null : entry.d;
                          return (
                            <motion.li
                              key={name}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03, duration: 0.2 }}
                            >
                              <button
                                onMouseDown={() => selectFrom(name)}
                                className="w-full text-left px-4 py-3 hover:bg-accent/5 text-sm text-foreground transition-colors flex items-center gap-3 border-b border-border/30 last:border-0"
                              >
                                <MapPin size={14} className="text-accent shrink-0" />
                                <span className="flex-1 truncate">{fromSuggestions.mode === "search" ? highlightMatch(name, fromQuery) : name}</span>
                                {dist != null && (
                                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{formatDistance(dist)}</span>
                                )}
                              </button>
                            </motion.li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                {/* To */}
                <div className="relative">
                  <motion.input
                    ref={toRef}
                    type="text"
                    value={toQuery}
                    onChange={(e) => { setToQuery(e.target.value); setToStop(null); }}
                    onFocus={() => setFocusedField("to")}
                    onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                    placeholder="Dokąd jedziesz?"
                    className={`w-full bg-muted/50 rounded-xl pl-4 pr-16 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none text-sm transition-all border-2 ${
                      toStop
                        ? "border-destructive/30 bg-destructive/5"
                        : focusedField === "to"
                        ? "border-primary/40 bg-background"
                        : "border-transparent"
                    }`}
                    layout
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    <AnimatePresence>
                      {toQuery && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          onMouseDown={(e) => { e.preventDefault(); setToQuery(""); setToStop(null); toRef.current?.focus(); }}
                          className="text-muted-foreground/50 hover:text-foreground transition-colors p-1.5"
                          aria-label="Wyczyść pole"
                        >
                          <X size={14} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); useMyLocation("to"); }}
                      disabled={geoLoading !== null}
                      className={`p-1.5 rounded-md transition-colors ${
                        geoLoading === "to"
                          ? "text-primary animate-pulse"
                          : "text-muted-foreground/60 hover:text-primary hover:bg-primary/5"
                      }`}
                      aria-label="Użyj mojej lokalizacji jako cel"
                      title="Użyj mojej lokalizacji"
                    >
                      <Locate size={15} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {focusedField === "to" && (toSuggestions.mode === "nearby" || toSuggestions.stops.length > 0) && (
                      <motion.ul
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute z-40 left-0 right-0 bg-popover border border-border rounded-xl mt-1.5 shadow-2xl max-h-72 overflow-y-auto"
                      >
                        {toSuggestions.mode === "nearby" && (
                          <li>
                            <button
                              onMouseDown={(e) => { e.preventDefault(); useMyLocation("to"); }}
                              className="w-full text-left px-4 py-3 hover:bg-primary/5 text-sm text-foreground transition-colors flex items-center gap-3 border-b border-border/30"
                            >
                              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary">
                                <Locate size={13} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">Moja lokalizacja</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {geoLoading === "to" ? "Wyszukuję najbliższy przystanek…" : userPos ? "Najbliższy przystanek wg GPS" : "Kliknij, aby pobrać GPS"}
                                </p>
                              </div>
                            </button>
                          </li>
                        )}
                        {toSuggestions.mode === "nearby" && userPos && toSuggestions.stops.length > 0 && (
                          <li className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60 bg-muted/30">
                            Przystanki w pobliżu
                          </li>
                        )}
                        {toSuggestions.stops.map((entry, i) => {
                          const name = typeof entry === "string" ? entry : entry.name;
                          const dist = typeof entry === "string" ? null : entry.d;
                          return (
                            <motion.li
                              key={name}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03, duration: 0.2 }}
                            >
                              <button
                                onMouseDown={() => selectTo(name)}
                                className="w-full text-left px-4 py-3 hover:bg-destructive/5 text-sm text-foreground transition-colors flex items-center gap-3 border-b border-border/30 last:border-0"
                              >
                                <MapPin size={14} className="text-destructive/70 shrink-0" />
                                <span className="flex-1 truncate">{toSuggestions.mode === "search" ? highlightMatch(name, toQuery) : name}</span>
                                {dist != null && (
                                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{formatDistance(dist)}</span>
                                )}
                              </button>
                            </motion.li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

              </div>

              {/* Swap button */}
              <div className="flex flex-col items-center justify-center">
                <motion.button
                  onClick={swapStops}
                  className="p-2 rounded-full border border-border bg-background hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Zamień kierunki"
                  whileTap={{ scale: 0.85, rotate: 180 }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <ArrowUpDown size={16} />
                </motion.button>
              </div>
            </div>

            {/* Time picker & action row */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
              <motion.button
                onClick={() => setShowTimePicker(!showTimePicker)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  departureTime === "now"
                    ? "bg-primary/10 text-primary font-medium"
                    : "bg-secondary/20 text-secondary-foreground font-medium"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <Clock size={14} />
                {departureTime === "now" ? "Teraz" : departureTime}
              </motion.button>

              <AnimatePresence>
                {showTimePicker && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="flex items-center gap-2 overflow-hidden"
                  >
                    <button
                      onClick={() => { setDepartureTime("now"); setShowTimePicker(false); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                        departureTime === "now" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10"
                      }`}
                    >
                      Teraz
                    </button>
                    <input
                      type="time"
                      value={departureTime === "now" ? currentTimeStr : departureTime}
                      onChange={(e) => { setDepartureTime(e.target.value); setShowTimePicker(false); }}
                      className="px-2 py-1.5 rounded-md bg-muted border border-border text-sm text-foreground outline-none focus:border-primary/40"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {rtData && (
                <span className="flex items-center gap-1.5 text-[11px] text-accent font-medium ml-auto">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                  </span>
                  Na żywo
                </span>
              )}

              <AnimatePresence>
                {(hasResults || hasPartialInput) && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={clearSearch}
                    className="ml-auto text-xs text-muted-foreground hover:text-destructive px-2 py-1.5 rounded-md hover:bg-destructive/5 transition-all"
                    whileTap={{ scale: 0.9 }}
                  >
                    Wyczyść
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Geolocation status row */}
            <AnimatePresence>
              {(geoError || nearestInfo) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {geoError ? (
                    <div className="mt-2 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs">
                      <span className="flex items-center gap-1.5"><Locate size={12} />{geoError}</span>
                      <button onClick={() => setGeoError(null)} className="opacity-70 hover:opacity-100"><X size={12} /></button>
                    </div>
                  ) : nearestInfo ? (
                    <div className="mt-2 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs">
                      <span className="flex items-center gap-1.5 truncate">
                        <Locate size={12} className="shrink-0" />
                        <span className="truncate">
                          {nearestInfo.field === "from" ? "Skąd" : "Dokąd"}: <strong className="font-semibold">{nearestInfo.stop}</strong>
                          <span className="ml-1 text-primary/70">· {formatDistance(nearestInfo.distance)} od Ciebie</span>
                        </span>
                      </span>
                      <button onClick={() => setNearestInfo(null)} className="opacity-70 hover:opacity-100 shrink-0"><X size={12} /></button>
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>


          {/* Content area with animated transitions */}
          <AnimatePresence mode="wait">
            {/* Results */}
            {hasResults && (
              <motion.div
                key="results"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="border-t border-border overflow-hidden"
              >
                {results.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {/* Results header */}
                    <motion.div
                      className="px-4 py-3 bg-muted/30 flex items-center justify-between"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                    >
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{results.length}</span>{" "}
                        {results.length === 1 ? "połączenie" : results.length < 5 ? "połączenia" : "połączeń"}
                        <span className="ml-1.5 text-[10px] text-muted-foreground/60">· sort. wg odjazdu</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-medium uppercase tracking-wide transition-colors ${
                            rtLoading
                              ? "text-primary animate-pulse"
                              : rtData?.lastUpdated
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-muted-foreground"
                          }`}
                          aria-live="polite"
                        >
                          {rtLoading ? "Pobieram…" : rtData?.lastUpdated ? "Aktualne" : "Oczekiwanie"}
                        </span>
                        <LiveFreshnessBadge lastUpdated={rtData?.lastUpdated ?? null} loading={rtLoading} />
                      </div>
                    </motion.div>

                    {/* Journey cards */}
                    {results.map(({ route, stopsCount, nextDepartures, arrivalDep, delay, vehicle, vehicleCount, alerts, estimatedMinutes, isLiveTrip }, index) => {
                      const isTram = route.type === "tram";
                      const hasAlert = alerts.length > 0;
                      const nextDep = nextDepartures[0];

                      const addDelay = (hhmm: string) => {
                        const [h, m] = hhmm.split(":").map(Number);
                        const total = h * 60 + m + (delay ? Math.round(delay / 60) : 0);
                        return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(((total % 60) + 60) % 60).padStart(2, "0")}`;
                      };
                      const realDep = nextDep && delay !== null ? addDelay(nextDep) : null;
                      const arrivalTime = arrivalDep ? addDelay(arrivalDep) : null;

                      // Live countdown using real (RT-adjusted) departure when available.
                      const minutesUntil = (() => {
                        const target = realDep ?? nextDep;
                        if (!target) return null;
                        const [h, m] = target.split(":").map(Number);
                        const now = new Date(nowTick);
                        let diff = h * 60 + m - (now.getHours() * 60 + now.getMinutes());
                        if (diff < -60) diff += 24 * 60; // wrap past midnight
                        return diff;
                      })();
                      const status: { label: string; tone: "imminent" | "soon" | "later" } | null =
                        minutesUntil == null
                          ? null
                          : minutesUntil <= 0
                            ? { label: "odjeżdża", tone: "imminent" }
                            : minutesUntil <= 1
                              ? { label: "za 1 min", tone: "imminent" }
                              : minutesUntil <= 5
                                ? { label: `za ${minutesUntil} min`, tone: "soon" }
                                : minutesUntil <= 60
                                  ? { label: `za ${minutesUntil} min`, tone: "later" }
                                  : null;

                      return (
                        <motion.button
                          key={route.id}
                          custom={index}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          onClick={() => onRouteSelect(route)}
                          className="w-full flex items-stretch gap-0 px-4 py-3.5 hover:bg-primary/[0.02] transition-colors text-left group"
                          whileHover={{ x: 4, backgroundColor: "hsl(var(--primary) / 0.03)" }}
                          whileTap={{ scale: 0.99 }}
                        >
                          {/* Time column — scheduled (struck if delayed) + real time */}
                          <div className="flex flex-col items-end justify-between pr-3 min-w-[60px] shrink-0">
                            {nextDep ? (
                              <>
                                <div className="flex flex-col items-end leading-none">
                                  {realDep && realDep !== nextDep && (
                                    <span className="text-[10px] text-muted-foreground/60 line-through tabular-nums">{nextDep}</span>
                                  )}
                                  <span className={`font-heading font-bold text-base tabular-nums leading-tight ${
                                    realDep && realDep !== nextDep ? "text-destructive" : "text-foreground"
                                  }`}>{realDep ?? nextDep}</span>
                                </div>
                                {arrivalTime && (
                                  <span className="font-heading font-bold text-foreground text-base leading-tight tabular-nums">{arrivalTime}</span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>


                          {/* Timeline visual */}
                          <div className="flex flex-col items-center mx-1 shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full border-2 border-accent bg-card shrink-0" />
                            <div className="w-0.5 flex-1 bg-border my-0.5 min-h-[16px]" style={{ borderLeft: `2px dashed hsl(var(--border))`, width: 0 }} />
                            <div className="w-0.5 flex-1 bg-border my-0.5 min-h-[16px]" />
                            <div className="w-2.5 h-2.5 rounded-full border-2 border-destructive bg-card shrink-0" />
                          </div>

                          {/* Route info */}
                          <div className="flex-1 min-w-0 pl-3 flex flex-col justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground truncate">{fromStop || route.from}</span>
                            </div>
                            <div className="flex items-center gap-2 my-1.5">
                              <motion.div
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0"
                                style={{ backgroundColor: `#${route.color}20`, color: `#${route.color}` }}
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.05 + 0.1, type: "spring", stiffness: 500 }}
                              >
                                {isTram ? <TrainFront size={12} /> : <Bus size={12} />}
                                {route.num}
                              </motion.div>
                              <span className="text-[11px] text-muted-foreground truncate">
                                kier. {route.to}
                              </span>
                              {fromStop && toStop && (
                                <span className="text-[11px] text-muted-foreground/60 shrink-0">
                                  · {stopsCount} prz.
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground truncate">{toStop || route.to}</span>
                            </div>
                          </div>

                          {/* Right side */}
                          <div className="flex flex-col items-end justify-between pl-2 shrink-0 gap-1.5">
                            <div className="flex flex-col items-end gap-0.5">
                              {status && (
                                <motion.span
                                  key={status.label}
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold tabular-nums whitespace-nowrap ${
                                    status.tone === "imminent"
                                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 animate-pulse"
                                      : status.tone === "soon"
                                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                        : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {status.label}
                                </motion.span>
                              )}
                              {estimatedMinutes > 0 && fromStop && toStop && (
                                <span className="flex items-center gap-1 text-xs font-semibold text-foreground tabular-nums">
                                  <Timer size={12} className="text-muted-foreground" />
                                  {estimatedMinutes} min
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {delay !== null && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  title={isLiveTrip ? "Opóźnienie tego kursu (RT)" : "Średnie opóźnienie linii (RT)"}
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                    delay > 120
                                      ? "bg-destructive/10 text-destructive"
                                      : "bg-accent/10 text-accent"
                                  }`}
                                >
                                  {formatDelay(delay)}
                                </motion.span>
                              )}
                              {vehicle && (
                                <span
                                  className="flex items-center gap-1 text-[10px] text-muted-foreground/80 tabular-nums"
                                  title={`Pojazd ${vehicle.label || vehicle.vehicleId}${vehicle.speed ? ` · ${Math.round(vehicle.speed * 3.6)} km/h` : ""}`}
                                >
                                  <Radio size={9} className="text-emerald-500" />
                                  #{vehicle.label || vehicle.vehicleId.slice(-4)}
                                </span>
                              )}
                              {hasAlert && (
                                <motion.span
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium"
                                >
                                  ⚠️ alert
                                </motion.span>
                              )}
                              {!vehicle && vehicleCount > 0 && !hasAlert && delay === null && (
                                <span className="text-[10px] text-muted-foreground/50">
                                  {vehicleCount} poj.
                                </span>
                              )}
                            </div>
                            <ChevronRight size={16} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
                          </div>

                        </motion.button>
                      );
                    })}

                    {nextDeparturesAvailable(results) && (
                      <motion.div
                        className="px-4 py-2.5 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <span className="text-[11px] text-muted-foreground/60">Następne odjazdy: {
                          results[0]?.nextDepartures.slice(1).join(", ")
                        }</span>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <motion.div
                    className="py-10 text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Search size={28} className="mx-auto text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">Brak połączeń</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Spróbuj zmienić przystanki lub godzinę odjazdu</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Partial input hint */}
            {hasPartialInput && (
              <motion.div
                key="partial"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="border-t border-border/50 overflow-hidden"
              >
                <div className="py-8 text-center px-4">
                  <motion.div
                    className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <MapPin size={20} className="text-primary" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground">
                    {fromStop ? "Wpisz przystanek docelowy" : "Wpisz przystanek początkowy"}
                  </p>
                  <p className="text-[11px] text-muted-foreground/40 mt-1">
                    Wyniki pojawią się po wybraniu obu przystanków
                  </p>
                </div>
              </motion.div>
            )}

            {/* History / empty state */}
            {!hasResults && !hasPartialInput && (
              <motion.div
                key="empty"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="border-t border-border/50 overflow-hidden"
              >
                {history.length > 0 ? (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        <History size={12} />
                        Ostatnie
                      </div>
                      <motion.button
                        onClick={clearHistory}
                        className="text-[11px] text-muted-foreground/50 hover:text-destructive flex items-center gap-1 transition-colors"
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 size={10} />
                        Wyczyść
                      </motion.button>
                    </div>
                    <div className="space-y-1">
                      {history.map((entry, i) => (
                        <motion.div
                          key={`${entry.from}-${entry.to}-${entry.timestamp}`}
                          className="flex items-center gap-2 group"
                          custom={i}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <button
                            onClick={() => loadFromHistory(entry.from, entry.to)}
                            className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-all text-left"
                          >
                            <div className="flex flex-col items-center shrink-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                              <div className="w-px h-2.5 bg-border" />
                              <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground truncate leading-tight">{entry.from}</p>
                              <p className="text-sm text-foreground truncate leading-tight">{entry.to}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground/40 shrink-0">
                              {new Date(entry.timestamp).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
                            </span>
                          </button>
                          <motion.button
                            onClick={() => removeEntry(i)}
                            className="p-1 rounded text-muted-foreground/20 hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-all"
                            aria-label="Usuń"
                            whileTap={{ scale: 0.8 }}
                          >
                            <X size={12} />
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center px-4">
                    <motion.div
                      className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <Navigation size={20} className="text-muted-foreground/30" />
                    </motion.div>
                    <p className="text-sm text-muted-foreground/60">
                      Wpisz skąd i dokąd jedziesz
                    </p>
                    <p className="text-[11px] text-muted-foreground/40 mt-1">
                      Wyniki pokażą się automatycznie z danymi na żywo
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

function nextDeparturesAvailable(results: { nextDepartures: string[] }[]): boolean {
  return results.length > 0 && results[0].nextDepartures.length > 1;
}

export default RouteSearch;
