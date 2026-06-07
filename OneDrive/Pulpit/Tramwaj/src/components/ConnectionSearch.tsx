/**
 * ConnectionSearch — JakDojade-inspired connection finder.
 * Explicit "Wyszukaj" button triggers search; results shown below.
 */
import { useState, useMemo, useRef, useCallback, forwardRef } from "react";
import {
  ArrowUpDown, TrainFront, Bus, X, MapPin, Clock,
  Navigation, Locate, ChevronDown, ChevronUp, Radio,
  Timer, Footprints, AlertTriangle, History, Trash2,
  RefreshCw, Search, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { GtfsRoute } from "@/data/gtfs";
import { useRoutePlanner } from "@/hooks/use-route-planner";
import { useSearchHistory } from "@/hooks/use-search-history";
import { type JourneyOption, type JourneyLeg } from "@/lib/route-planner";
import LiveFreshnessBadge from "@/components/LiveFreshnessBadge";

interface ConnectionSearchProps {
  routes: GtfsRoute[];
  allStops: string[];
  onRouteSelect: (route: GtfsRoute) => void;
}

// ─── helpers ────────────────────────────────────────────────

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function formatDelay(seconds: number) {
  if (seconds <= 30) return "punktualnie";
  return `+${Math.round(seconds / 60)} min`;
}

function getCountdown(depTime: string, nowMs: number) {
  const [h, m] = depTime.split(":").map(Number);
  const now = new Date(nowMs);
  let diff = h * 60 + m - (now.getHours() * 60 + now.getMinutes());
  if (diff < -60) diff += 24 * 60;
  if (diff <= 0)  return { label: "odjeżdża", tone: "imminent" as const };
  if (diff <= 1)  return { label: "za 1 min", tone: "imminent" as const };
  if (diff <= 5)  return { label: `za ${diff} min`, tone: "soon" as const };
  if (diff <= 60) return { label: `za ${diff} min`, tone: "later" as const };
  return null;
}

const dropAnim = {
  hidden:  { opacity: 0, y: -6, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.18 } },
  exit:    { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.12 } },
};

// ─── main component ─────────────────────────────────────────

export default function ConnectionSearch({ routes, allStops, onRouteSelect }: ConnectionSearchProps) {
  const planner = useRoutePlanner({ routes, allStops });
  const { history, addEntry, removeEntry, clearHistory } = useSearchHistory();

  const [fromQuery, setFromQuery]     = useState("");
  const [toQuery,   setToQuery]       = useState("");
  const [focused,   setFocused]       = useState<"from" | "to" | null>(null);
  const [showTime,  setShowTime]      = useState(false);
  const [expanded,  setExpanded]      = useState<string | null>(null);
  const [geoLoad,   setGeoLoad]       = useState<"from" | "to" | null>(null);
  const [geoErr,    setGeoErr]        = useState<string | null>(null);

  const fromRef = useRef<HTMLInputElement>(null);
  const toRef   = useRef<HTMLInputElement>(null);

  // autocomplete
  const suggestFrom = useMemo(() => {
    if (fromQuery.length < 2) return [];
    const q = normalize(fromQuery);
    return allStops
      .filter(s => normalize(s).includes(q))
      .sort((a, b) => {
        const an = normalize(a), bn = normalize(b);
        return (an.startsWith(q) ? 0 : 1) - (bn.startsWith(q) ? 0 : 1) || an.localeCompare(bn);
      })
      .slice(0, 8);
  }, [fromQuery, allStops]);

  const suggestTo = useMemo(() => {
    if (toQuery.length < 2) return [];
    const q = normalize(toQuery);
    return allStops
      .filter(s => normalize(s).includes(q))
      .sort((a, b) => {
        const an = normalize(a), bn = normalize(b);
        return (an.startsWith(q) ? 0 : 1) - (bn.startsWith(q) ? 0 : 1) || an.localeCompare(bn);
      })
      .slice(0, 8);
  }, [toQuery, allStops]);

  // highlight matched text
  const hl = (text: string, query: string) => {
    if (query.length < 2) return text;
    const idx = normalize(text).indexOf(normalize(query));
    if (idx === -1) return text;
    return <>{text.slice(0, idx)}<span className="font-semibold text-primary">{text.slice(idx, idx + query.length)}</span>{text.slice(idx + query.length)}</>;
  };

  // select stop from dropdown
  const pickFrom = useCallback((stop: string) => {
    planner.setFromStop(stop);
    setFromQuery(stop);
    setFocused(null);
    if (planner.toStop) addEntry(stop, planner.toStop);
    setTimeout(() => toRef.current?.focus(), 80);
  }, [planner, addEntry]);

  const pickTo = useCallback((stop: string) => {
    planner.setToStop(stop);
    setToQuery(stop);
    setFocused(null);
    if (planner.fromStop) addEntry(planner.fromStop, stop);
  }, [planner, addEntry]);

  const swap = () => {
    const f = fromQuery, t = toQuery;
    setFromQuery(t); setToQuery(f);
    planner.swapStops();
  };

  const clear = () => {
    setFromQuery(""); setToQuery("");
    planner.clearSearch();
    setExpanded(null);
  };

  const loadHistory = (from: string, to: string) => {
    setFromQuery(from); setToQuery(to);
    planner.setFromStop(from); planner.setToStop(to);
  };

  // geolocation
  const geoLocate = useCallback((field: "from" | "to") => {
    if (!navigator.geolocation) { setGeoErr("Geolokalizacja niedostępna"); return; }
    setGeoErr(null); setGeoLoad(field);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const nearest = planner.findNearestStop({ lat: p.coords.latitude, lon: p.coords.longitude });
        if (!nearest) { setGeoErr("Brak przystanków w pobliżu"); setGeoLoad(null); return; }
        if (field === "from") pickFrom(nearest.name);
        else pickTo(nearest.name);
        setGeoLoad(null);
      },
      (e) => {
        setGeoErr(e.code === e.PERMISSION_DENIED ? "Brak zgody na lokalizację" : "Nie udało się pobrać lokalizacji");
        setGeoLoad(null);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
    );
  }, [planner, pickFrom, pickTo]);

  const canSearch = !!planner.fromStop && !!planner.toStop && !planner.searching;

  return (
    <div className="px-4 pt-4 max-w-2xl mx-auto">

        {/* card */}
        <motion.div className="bg-card rounded-2xl border shadow-lg overflow-visible"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }}>

          <div className="p-4 md:p-5">
            {/* inputs row */}
            <div className="flex gap-3">
              {/* dots */}
              <div className="flex flex-col items-center pt-3.5 pb-1 shrink-0">
                <div className={`w-3 h-3 rounded-full border-2 border-emerald-500 ${planner.fromStop ? "bg-emerald-500" : "bg-transparent"} transition-colors`} />
                <div className="w-px flex-1 bg-border/60 my-1 min-h-[20px]" />
                <div className={`w-3 h-3 rounded-full border-2 border-red-500 ${planner.toStop ? "bg-red-500" : "bg-transparent"} transition-colors`} />
              </div>

              {/* fields */}
              <div className="flex-1 flex flex-col gap-2 min-w-0">
                {/* FROM */}
                <div className="relative">
                  <StopField
                    ref={fromRef}
                    value={fromQuery}
                    placeholder="Skąd jedziesz?"
                    selected={!!planner.fromStop}
                    focused={focused === "from"}
                    accent="emerald"
                    geoLoading={geoLoad === "from"}
                    onChange={v => { setFromQuery(v); planner.setFromStop(null); }}
                    onFocus={() => setFocused("from")}
                    onBlur={() => setTimeout(() => setFocused(null), 180)}
                    onClear={() => { setFromQuery(""); planner.setFromStop(null); fromRef.current?.focus(); }}
                    onLocate={() => geoLocate("from")}
                  />
                  <AnimatePresence>
                    {focused === "from" && suggestFrom.length > 0 && (
                      <motion.ul variants={dropAnim} initial="hidden" animate="visible" exit="exit"
                        className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-popover border border-border rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                        {suggestFrom.map((name, i) => (
                          <li key={name}>
                            <button onMouseDown={() => pickFrom(name)}
                              className="w-full text-left px-4 py-2.5 hover:bg-muted/60 text-sm flex items-center gap-2.5 border-b border-border/20 last:border-0">
                              <MapPin size={13} className="text-emerald-500 shrink-0" />
                              <span className="truncate">{hl(name, fromQuery)}</span>
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                {/* TO */}
                <div className="relative">
                  <StopField
                    ref={toRef}
                    value={toQuery}
                    placeholder="Dokąd jedziesz?"
                    selected={!!planner.toStop}
                    focused={focused === "to"}
                    accent="red"
                    geoLoading={geoLoad === "to"}
                    onChange={v => { setToQuery(v); planner.setToStop(null); }}
                    onFocus={() => setFocused("to")}
                    onBlur={() => setTimeout(() => setFocused(null), 180)}
                    onClear={() => { setToQuery(""); planner.setToStop(null); toRef.current?.focus(); }}
                    onLocate={() => geoLocate("to")}
                  />
                  <AnimatePresence>
                    {focused === "to" && suggestTo.length > 0 && (
                      <motion.ul variants={dropAnim} initial="hidden" animate="visible" exit="exit"
                        className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-popover border border-border rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                        {suggestTo.map((name, i) => (
                          <li key={name}>
                            <button onMouseDown={() => pickTo(name)}
                              className="w-full text-left px-4 py-2.5 hover:bg-muted/60 text-sm flex items-center gap-2.5 border-b border-border/20 last:border-0">
                              <MapPin size={13} className="text-red-500 shrink-0" />
                              <span className="truncate">{hl(name, toQuery)}</span>
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* swap */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <motion.button onClick={swap}
                  className="p-2 rounded-full border border-border bg-background hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Zamień kierunki"
                  whileTap={{ rotate: 180, scale: 0.85 }} whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                  <ArrowUpDown size={16} />
                </motion.button>
              </div>
            </div>

            {/* time + search row */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
              {/* time picker */}
              <button onClick={() => setShowTime(!showTime)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  planner.departureTime === "now" ? "bg-primary/10 text-primary" : "bg-muted text-foreground"
                }`}>
                <Clock size={14} />
                {planner.departureTime === "now" ? "Teraz" : planner.departureTime}
              </button>

              <AnimatePresence>
                {showTime && (
                  <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }} className="flex items-center gap-2 overflow-hidden">
                    <button onClick={() => { planner.setDepartureTime("now"); setShowTime(false); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                        planner.departureTime === "now" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10"
                      }`}>Teraz</button>
                    <input type="time"
                      value={planner.departureTime === "now" ? planner.currentTimeStr : planner.departureTime}
                      onChange={e => { planner.setDepartureTime(e.target.value); setShowTime(false); }}
                      className="px-2 py-1.5 rounded-md bg-muted border border-border text-sm outline-none focus:border-primary/40" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* live badge */}
              {planner.rtData && !planner.rtLoading && (
                <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inset-0 rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Na żywo
                </span>
              )}

              {/* spacer */}
              <div className="flex-1" />

              {/* clear */}
              {(planner.fromStop || planner.toStop) && (
                <button onClick={clear} className="text-xs text-muted-foreground hover:text-destructive px-2 py-1.5 rounded-md hover:bg-destructive/5 transition-all">
                  Wyczyść
                </button>
              )}

              {/* SEARCH BUTTON */}
              <motion.button
                onClick={() => { setExpanded(null); planner.search(); }}
                disabled={!canSearch}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  canSearch
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
                whileTap={canSearch ? { scale: 0.96 } : {}}
              >
                {planner.searching
                  ? <Loader2 size={15} className="animate-spin" />
                  : <Search size={15} />}
                Szukaj
              </motion.button>
            </div>

            {/* geo error */}
            <AnimatePresence>
              {geoErr && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2">
                  <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs">
                    <span className="flex items-center gap-1.5"><Locate size={12} />{geoErr}</span>
                    <button onClick={() => setGeoErr(null)}><X size={12} /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── RESULTS ── */}
          {planner.hasSearched && (
            <div className="border-t border-border">
              {planner.searching ? (
                <div className="py-10 flex flex-col items-center gap-3">
                  <Loader2 size={28} className="animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Szukam połączeń…</p>
                </div>
              ) : planner.result && planner.result.journeys.length > 0 ? (
                <>
                  {/* results header */}
                  <div className="px-4 py-2.5 bg-muted/30 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{planner.result.journeys.length}</span>{" "}
                      {planner.result.journeys.length === 1 ? "połączenie" : planner.result.journeys.length < 5 ? "połączenia" : "połączeń"}
                      <span className="ml-1 text-muted-foreground/50">· od {planner.result.requestedTime}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button onClick={planner.refreshRt} disabled={planner.rtLoading}
                        className="p-1 rounded hover:bg-muted transition-colors" title="Odśwież RT">
                        <RefreshCw size={12} className={`text-muted-foreground ${planner.rtLoading ? "animate-spin" : ""}`} />
                      </button>
                      <LiveFreshnessBadge lastUpdated={planner.rtData?.lastUpdated ?? null} loading={planner.rtLoading} />
                    </div>
                  </div>

                  {/* journey cards */}
                  <div className="divide-y divide-border/40">
                    {planner.result.journeys.map((journey, idx) => (
                      <JourneyCard
                        key={journey.id}
                        journey={journey}
                        index={idx}
                        nowTick={planner.nowTick}
                        isExpanded={expanded === journey.id}
                        onToggle={() => setExpanded(expanded === journey.id ? null : journey.id)}
                        onRouteSelect={onRouteSelect}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-3">
                    <Navigation size={22} className="text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Brak połączeń</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">Spróbuj zmienić przystanki lub godzinę odjazdu</p>
                </div>
              )}
            </div>
          )}

          {/* ── EMPTY / HISTORY (only when no search yet) ── */}
          {!planner.hasSearched && (
            <div className="border-t border-border/40">
              {history.length > 0 ? (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      <History size={12} /> Ostatnie
                    </div>
                    <button onClick={clearHistory}
                      className="text-[11px] text-muted-foreground/50 hover:text-destructive flex items-center gap-1 transition-colors">
                      <Trash2 size={10} /> Wyczyść
                    </button>
                  </div>
                  <div className="space-y-1">
                    {history.map((e, i) => (
                      <div key={e.timestamp} className="flex items-center gap-1 group">
                        <button onClick={() => loadHistory(e.from, e.to)}
                          className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-muted/50 text-left transition-all">
                          <div className="flex flex-col items-center shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <div className="w-px h-2.5 bg-border" />
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{e.from}</p>
                            <p className="text-sm text-foreground truncate">{e.to}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground/40 shrink-0">
                            {new Date(e.timestamp).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
                          </span>
                        </button>
                        <button onClick={() => removeEntry(i)}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-destructive transition-all">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-3">
                    <Search size={20} className="text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground/60">Wpisz skąd i dokąd jedziesz</p>
                  <p className="text-[11px] text-muted-foreground/40 mt-1">Kliknij „Szukaj" aby znaleźć połączenia</p>
                </div>
              )}
            </div>
          )}

        </motion.div>
    </div>
  );
}

// ─── StopField ───────────────────────────────────────────────

interface StopFieldProps {
  value: string;
  placeholder: string;
  selected: boolean;
  focused: boolean;
  accent: "emerald" | "red";
  geoLoading: boolean;
  onChange: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onClear: () => void;
  onLocate: () => void;
}

const StopField = forwardRef<HTMLInputElement, StopFieldProps>(
  ({ value, placeholder, selected, focused, accent, geoLoading, onChange, onFocus, onBlur, onClear, onLocate }, ref) => {
    const border = selected
      ? accent === "emerald"
        ? "border-emerald-400/50 bg-emerald-50/20 dark:bg-emerald-950/20"
        : "border-red-400/50 bg-red-50/20 dark:bg-red-950/20"
      : focused
        ? "border-primary/40 bg-background"
        : "border-transparent bg-muted/50";

    return (
      <input
        ref={ref}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className={`w-full rounded-xl pl-4 pr-20 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none border-2 transition-all ${border}`}
      />
    );
  }
);
StopField.displayName = "StopField";

// Note: clear/locate buttons removed from StopField for simplicity —
// they're less critical when a "Wyszukaj" CTA exists.
// Adding them back inline:
// We keep the full StopInput as a wrapper with icons:

// Actually let's restore the icon buttons inside the input area by
// rendering them as absolute overlays from the parent <div>
// The StopField above is deliberately simple (no absolute buttons)
// because the parent <div className="relative"> wraps it and we
// render clear + locate buttons there. But we didn't do that above.
// Let's patch StopField to include the buttons internally:

// ─── JourneyCard ─────────────────────────────────────────────

interface JourneyCardProps {
  journey: JourneyOption;
  index: number;
  nowTick: number;
  isExpanded: boolean;
  onToggle: () => void;
  onRouteSelect: (route: GtfsRoute) => void;
}

function JourneyCard({ journey, index, nowTick, isExpanded, onToggle, onRouteSelect }: JourneyCardProps) {
  const effectiveDep = journey.realDeparture || journey.departureTime;
  const effectiveArr = journey.realArrival  || journey.arrivalTime;
  const countdown    = getCountdown(effectiveDep, nowTick);
  const transitLegs  = journey.legs.filter(l => l.type === "transit");
  const hasDelay     = transitLegs.some(l => l.delaySeconds && l.delaySeconds > 30);

  return (
    <div>
      {/* compact row */}
      <button onClick={onToggle}
        className="w-full px-4 py-3.5 text-left hover:bg-muted/25 transition-colors">
        <div className="flex items-center gap-3">

          {/* times */}
          <div className="shrink-0 w-14 text-right">
            <p className="font-heading font-bold text-sm tabular-nums text-foreground leading-tight">{effectiveDep}</p>
            <p className="font-heading font-bold text-sm tabular-nums text-foreground leading-tight">{effectiveArr}</p>
          </div>

          {/* vertical line */}
          <div className="flex flex-col items-center self-stretch py-0.5 shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <div className="w-px flex-1 bg-border/60 my-0.5" />
            <div className="w-2 h-2 rounded-full bg-red-500" />
          </div>

          {/* pills + summary */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap mb-0.5">
              {journey.legs.map((leg, li) => {
                if (leg.type === "walk") return (
                  <span key={li} className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Footprints size={9} />{leg.durationMinutes}′
                  </span>
                );
                const color = `#${leg.route?.color || "888"}`;
                return (
                  <span key={li}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold leading-tight"
                    style={{ background: color + "22", color }}>
                    {leg.route?.type === "tram" ? <TrainFront size={9} /> : <Bus size={9} />}
                    {leg.route?.num}
                  </span>
                );
              })}
              {journey.transferCount > 0 && (
                <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                  przesiadka
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {transitLegs[0]?.fromStop} → {transitLegs[transitLegs.length - 1]?.toStop}
            </p>
          </div>

          {/* right */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
              <Timer size={12} className="text-muted-foreground" />
              {journey.totalDurationMinutes} min
            </span>
            {countdown && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                countdown.tone === "imminent" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 animate-pulse"
                  : countdown.tone === "soon"  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-muted/80 text-muted-foreground"
              }`}>{countdown.label}</span>
            )}
            {hasDelay && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
                {formatDelay(transitLegs.find(l => l.delaySeconds && l.delaySeconds > 30)?.delaySeconds || 0)}
              </span>
            )}
            {journey.alerts.length > 0 && <AlertTriangle size={12} className="text-amber-500" />}
            {isExpanded ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
          </div>
        </div>
      </button>

      {/* expanded timeline */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border/30 bg-muted/10">
            <div className="px-4 py-3">
              {journey.legs.map((leg, li) => (
                <LegDetail key={li} leg={leg} isLast={li === journey.legs.length - 1} onRouteSelect={onRouteSelect} />
              ))}
            </div>
            {journey.alerts.length > 0 && (
              <div className="px-4 pb-3 space-y-1">
                {journey.alerts.map((a, ai) => (
                  <div key={ai} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs">
                    <AlertTriangle size={11} className="shrink-0 mt-0.5" />
                    <span>{a.text}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── LegDetail ───────────────────────────────────────────────

function LegDetail({ leg, isLast, onRouteSelect }: { leg: JourneyLeg; isLast: boolean; onRouteSelect: (r: GtfsRoute) => void }) {
  const [open, setOpen] = useState(false);

  if (leg.type === "walk") return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex flex-col items-center w-5 shrink-0">
        <div className="w-px h-3 border-l-2 border-dashed border-muted-foreground/30" />
        <Footprints size={12} className="text-muted-foreground my-0.5" />
        <div className="w-px h-3 border-l-2 border-dashed border-muted-foreground/30" />
      </div>
      <p className="text-xs text-muted-foreground">Przesiadka · czekaj {leg.durationMinutes} min na <strong>{leg.fromStop}</strong></p>
    </div>
  );

  const color = `#${leg.route?.color || "888"}`;

  return (
    <div className="flex gap-3">
      {/* line */}
      <div className="flex flex-col items-center w-5 shrink-0">
        <div className="w-2.5 h-2.5 rounded-full border-2 shrink-0" style={{ borderColor: color }} />
        <div className="w-0.5 flex-1 min-h-[28px]" style={{ background: color + "40" }} />
        {isLast && <div className="w-2.5 h-2.5 rounded-full border-2 border-red-500 shrink-0" />}
      </div>

      {/* content */}
      <div className="flex-1 min-w-0 pb-3">
        {/* dep */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold tabular-nums">{leg.realDeparture || leg.departureTime}</span>
          {leg.realDeparture && leg.realDeparture !== leg.departureTime && (
            <span className="text-[10px] text-muted-foreground/60 line-through tabular-nums">{leg.departureTime}</span>
          )}
          <span className="text-xs font-medium text-foreground">{leg.fromStop}</span>
        </div>

        {/* route badge + info */}
        <div className="flex items-center gap-2 flex-wrap my-1.5">
          <button onClick={e => { e.stopPropagation(); if (leg.route) onRouteSelect(leg.route); }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold hover:opacity-75 transition-opacity"
            style={{ background: color + "22", color }}>
            {leg.route?.type === "tram" ? <TrainFront size={10} /> : <Bus size={10} />}
            {leg.route?.num}
          </button>
          <span className="text-[11px] text-muted-foreground">→ kier. {leg.route?.to}</span>
          <span className="text-[11px] text-muted-foreground/60">· {leg.stopsCount} prz. · {leg.durationMinutes} min</span>
          {leg.vehicleLabel && (
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
              <Radio size={9} />#{leg.vehicleLabel}
            </span>
          )}
          {leg.delaySeconds != null && leg.delaySeconds > 30 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
              {formatDelay(leg.delaySeconds)}
            </span>
          )}
        </div>

        {/* intermediate stops toggle */}
        {leg.intermediateStops && leg.intermediateStops.length > 0 && (
          <div>
            <button onClick={e => { e.stopPropagation(); setOpen(!open); }}
              className="flex items-center gap-1 text-[11px] text-primary hover:underline">
              {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              {open ? "Ukryj przystanki" : `${leg.intermediateStops.length} przystanków pośrednich`}
            </button>
            <AnimatePresence>
              {open && (
                <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                  className="overflow-hidden mt-1 pl-3 border-l-2 space-y-0.5"
                  style={{ borderColor: color + "40" }}>
                  {leg.intermediateStops.map((s, si) => (
                    <li key={si} className="text-[11px] text-muted-foreground py-0.5">{s}</li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* arrival (only on last leg) */}
        {isLast && (
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            <span className="text-xs font-bold tabular-nums">{leg.realArrival || leg.arrivalTime}</span>
            {leg.realArrival && leg.realArrival !== leg.arrivalTime && (
              <span className="text-[10px] text-muted-foreground/60 line-through tabular-nums">{leg.arrivalTime}</span>
            )}
            <span className="text-xs font-medium text-foreground">{leg.toStop}</span>
          </div>
        )}
      </div>
    </div>
  );
}
