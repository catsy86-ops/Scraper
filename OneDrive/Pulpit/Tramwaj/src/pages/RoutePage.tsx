import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Clock, TrainFront, Bus, MapPin, Radio, AlertTriangle,
  ChevronDown, ChevronUp, ExternalLink, Star, RefreshCw, Search, X, Share2
} from "lucide-react";
import { toast } from "sonner";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, ReferenceLine
} from "recharts";
import { loadGtfsData, type GtfsRoute, type GtfsData } from "@/data/gtfs";
import { fetchGtfsRt, getRouteDelay, getRouteVehicles, getRouteAlerts, type GtfsRtData } from "@/data/gtfs-rt";
import Navbar from "@/components/Navbar";
import AppLayout from "@/components/AppLayout";
import { useFavorites } from "@/hooks/use-favorites";
import { useDelayHistory } from "@/hooks/use-delay-history";
import { useRtAlerts } from "@/hooks/use-rt-alerts";
import { useAlertHistory } from "@/hooks/use-alert-history";
import { useLastRouteStatus } from "@/hooks/use-last-route-status";
import { useQuietMode } from "@/hooks/use-quiet-mode";
import LiveFreshnessBadge from "@/components/LiveFreshnessBadge";
import AlertHistoryPanel from "@/components/AlertHistoryPanel";
import QuietModeToggle from "@/components/QuietModeToggle";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import "leaflet/dist/leaflet.css";

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };
const fadeUp = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };

// Fly-to helper component
const FlyToStop = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 16, { duration: 0.8 });
  }, [position, map]);
  return null;
};

const RoutePage = () => {
  const { routeId } = useParams<{ routeId: string }>();
  const [data, setData] = useState<GtfsData | null>(null);
  const [rtData, setRtData] = useState<GtfsRtData | null>(null);
  const [rtLoading, setRtLoading] = useState(false);
  const [expandedStop, setExpandedStop] = useState(0);
  const [stopSearch, setStopSearch] = useState("");
  const [highlightedStopIdx, setHighlightedStopIdx] = useState<number | null>(null);
  const stopRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { isFavorite, toggle } = useFavorites();

  useEffect(() => {
    loadGtfsData().then(setData);
  }, []);

  const route = useMemo(() => data?.routes.find((r) => r.id === routeId) ?? null, [data, routeId]);

  useMetaTags({
    title: route ? `Linia ${route.num} – ${route.name} | KaczTransit` : "KaczTransit",
    description: route
      ? `${route.from} → ${route.to} · ${route.stops.length} przystanków. Rozkład jazdy linii ${route.num} ZDiTM Szczecin w czasie rzeczywistym.`
      : undefined,
    url: typeof window !== "undefined" && route ? `${window.location.origin}/route/${route.id}` : undefined,
    type: "article",
  });

  const refreshRt = async () => {
    setRtLoading(true);
    try { const rt = await fetchGtfsRt(); setRtData(rt); } finally { setRtLoading(false); }
  };

  useEffect(() => {
    refreshRt();
    let iv: ReturnType<typeof setInterval> | null = null;
    const start = () => { if (!iv) iv = setInterval(refreshRt, 10_000); };
    const stop = () => { if (iv) { clearInterval(iv); iv = null; } };
    const onVis = () => { if (document.hidden) stop(); else { refreshRt(); start(); } };
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const liveDelay = rtData && route ? getRouteDelay(route.id, rtData.tripUpdates) : null;
  const liveVehicles = rtData && route ? getRouteVehicles(route.id, rtData.vehicles) : [];
  const liveAlerts = rtData && route ? getRouteAlerts(route.id, rtData.alerts) : [];

  const cachedStatus = useLastRouteStatus(
    route?.id,
    rtData && route ? { delay: liveDelay, alerts: liveAlerts, vehicleCount: liveVehicles.length } : null,
    !!rtData
  );

  // Use live data when available, otherwise fall back to last persisted snapshot
  const usingCached = !rtData && !!cachedStatus;
  const delay = rtData ? liveDelay : cachedStatus?.delay ?? null;
  const vehicles = liveVehicles; // positions are not persisted
  const alerts = rtData ? liveAlerts : cachedStatus?.alerts ?? [];
  const { samples: delayHistory, clear: clearDelayHistory } = useDelayHistory(route?.id, rtData ? liveDelay : null);


  const quiet = useQuietMode(route?.id);
  useRtAlerts({ routeId: route?.id, routeNum: route?.num, alerts, delay, enabled: !quiet.muted });
  const { entries: alertHistory, clear: clearAlertHistory } = useAlertHistory(route?.id, alerts, delay);

  const delayHistoryChart = useMemo(
    () =>
      delayHistory.map((s) => ({
        time: new Date(s.t).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }),
        ts: s.t,
        delay: Math.round((s.d / 60) * 10) / 10, // minutes, 1 decimal
      })),
    [delayHistory]
  );

  const avgHistDelay = delayHistory.length
    ? delayHistory.reduce((a, b) => a + b.d, 0) / delayHistory.length / 60
    : 0;
  const maxHistDelay = delayHistory.length
    ? Math.max(...delayHistory.map((s) => s.d)) / 60
    : 0;

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  // Delay chart data: per-stop delays from RT
  const delayChartData = useMemo(() => {
    if (!route || !rtData) return [];
    const routeTrips = rtData.tripUpdates.filter((t) => t.routeId === route.id);
    return route.stops.slice(0, 20).map((stop, idx) => {
      const delays = routeTrips
        .flatMap((t) => t.stopUpdates.filter((s) => s.stopId === stop.n || s.stopId === `${idx}`))
        .map((s) => s.departureDelay);
      const avg = delays.length > 0 ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length / 60) : 0;
      return { name: stop.n.length > 12 ? stop.n.slice(0, 12) + "…" : stop.n, delay: Math.max(avg, 0) };
    });
  }, [route, rtData]);

  // Hourly frequency chart
  const frequencyData = useMemo(() => {
    if (!route) return [];
    const hours: Record<number, number> = {};
    route.stops[0]?.d.forEach((dep) => {
      const h = parseInt(dep.split(":")[0]);
      hours[h] = (hours[h] || 0) + 1;
    });
    return Array.from({ length: 24 }, (_, h) => ({
      hour: `${h}:00`,
      count: hours[h] || 0,
    })).filter((d) => d.count > 0);
  }, [route]);

  // Map bounds
  const positions = useMemo(() =>
    route?.stops.filter((s) => s.la && s.lo).map((s) => [s.la, s.lo] as [number, number]) ?? [],
  [route]);

  // Highlighted stop position for map fly-to
  const highlightedPosition = useMemo<[number, number] | null>(() => {
    if (highlightedStopIdx === null || !route) return null;
    const s = route.stops[highlightedStopIdx];
    return s?.la && s?.lo ? [s.la, s.lo] : null;
  }, [highlightedStopIdx, route]);

  // Filtered stops for search
  const filteredStopIndices = useMemo(() => {
    if (!route || !stopSearch.trim()) return null;
    const q = stopSearch.toLowerCase();
    return route.stops
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.n.toLowerCase().includes(q))
      .map(({ i }) => i);
  }, [route, stopSearch]);

  const handleStopClick = (idx: number) => {
    setHighlightedStopIdx(idx);
    setExpandedStop(idx);
    stopRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (!data) {
    return (
      <AppLayout backTo="/">
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!route) {
    return (
      <AppLayout backTo="/">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-heading font-bold text-foreground">Nie znaleziono linii</h1>
          <Link to="/linie" className="text-primary mt-4 inline-block hover:underline">← Powrót do linii</Link>
        </div>
      </AppLayout>
    );
  }

  const isTram = route.type === "tram";
  const routeColor = `#${route.color}`;
  const shareUrl = `${window.location.origin}/route/${route.id}`;
  const shareTitle = `Linia ${route.num} – ${route.name} | KaczTransit`;
  const shareDescription = `${route.from} → ${route.to} · ${route.stops.length} przystanków. Sprawdź rozkład jazdy linii ${route.num} ZDiTM Szczecin w czasie rzeczywistym.`;

  const handleShare = async () => {
    const shareData = { title: shareTitle, text: shareDescription, url: shareUrl };
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link skopiowany do schowka");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Nie udało się udostępnić");
      }
    }
  };
  return (
    <AppLayout backTo="/linie">

      {/* Hero header */}
      <motion.section
        className="relative overflow-hidden py-6 md:py-10"
        style={{ background: `linear-gradient(135deg, ${routeColor}15, transparent 60%)` }}
        {...fadeUp}
      >
        <div className="container mx-auto px-4">
          <Link
            to="/linie"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft size={16} /> Wszystkie linie
          </Link>

          <motion.div className="flex items-center gap-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div
              className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl font-heading font-bold text-2xl md:text-3xl text-white shadow-lg"
              style={{ backgroundColor: routeColor }}
            >
              {route.num}
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isTram ? <TrainFront size={20} className="text-tram" /> : <Bus size={20} className="text-bus" />}
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{route.name}</h1>
              </div>
              <p className="text-muted-foreground mt-1">{route.from} → {route.to} · {route.stops.length} przystanków</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => toggle(route.id)}
                className="p-2.5 rounded-xl hover:bg-muted transition-colors"
                aria-label="Ulubione"
              >
                <Star size={22} className={isFavorite(route.id) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"} />
              </button>
              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
                aria-label="Udostępnij linię"
                title="Udostępnij"
              >
                <Share2 size={20} />
              </button>
              {route.url && (
                <a href={route.url} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
                  <ExternalLink size={20} />
                </a>
              )}
            </div>
          </motion.div>

          {/* RT status badges */}
          <motion.div className="flex flex-wrap items-center gap-2 mt-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            {(() => {
              const hasCancel = alerts.some((a) => a.effect === "Brak usługi");
              const highDelay = delay !== null && delay >= 300;
              const midDelay = delay !== null && delay >= 60 && delay < 300;
              const onTime = delay !== null && delay < 60;
              const tone = hasCancel
                ? { bg: "bg-destructive/15", text: "text-destructive", dot: "bg-destructive", label: "Zakłócenia" }
                : highDelay
                  ? { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive", label: "Znaczne opóźnienia" }
                  : midDelay
                    ? { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500", label: "Drobne opóźnienia" }
                    : onTime
                      ? { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", label: "Punktualnie" }
                      : { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Brak danych" };

              const minHist = delayHistory.length ? Math.min(...delayHistory.map((s) => s.d)) / 60 : 0;
              const maxHist = delayHistory.length ? Math.max(...delayHistory.map((s) => s.d)) / 60 : 0;
              const lastAlert = alerts[alerts.length - 1];
              const fmtMin = (m: number) => `${m >= 0 ? "" : ""}${(Math.round(m * 10) / 10).toFixed(1)} min`;

              return (
                <TooltipProvider delayDuration={150}>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <span className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-semibold cursor-help ${tone.bg} ${tone.text}`}>
                        <span className="relative inline-flex w-2.5 h-2.5">
                          <span className={`absolute inline-flex h-full w-full rounded-full ${tone.dot} opacity-60 animate-ping`} />
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${tone.dot}`} />
                        </span>
                        {tone.label}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="space-y-1.5 text-xs">
                        <p className="font-semibold">{tone.label}</p>
                        {delay !== null ? (
                          <p className="text-muted-foreground">
                            Aktualnie: <span className="text-foreground font-medium">{fmtMin(delay / 60)}</span>
                          </p>
                        ) : (
                          <p className="text-muted-foreground">Brak danych RT</p>
                        )}
                        {delayHistory.length > 1 && (
                          <p className="text-muted-foreground">
                            Zakres ostatnich {delayHistory.length} próbek:{" "}
                            <span className="text-foreground font-medium">{fmtMin(minHist)} – {fmtMin(maxHist)}</span>{" "}
                            (śr. {fmtMin(avgHistDelay)})
                          </p>
                        )}
                        {lastAlert && (
                          <div className="pt-1.5 mt-1.5 border-t border-border">
                            <p className="font-medium text-foreground flex items-center gap-1">
                              <AlertTriangle size={11} /> Ostatni alert
                            </p>
                            <p className="text-muted-foreground line-clamp-2">{lastAlert.headerText}</p>
                            {lastAlert.descriptionText && (
                              <p className="text-muted-foreground/80 line-clamp-2 mt-0.5">{lastAlert.descriptionText}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </UITooltip>

                  {vehicles.length > 0 && (
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg font-medium cursor-help">
                          <Radio size={12} className="animate-pulse" /> {vehicles.length} pojazdów na trasie
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        Pojazdy aktualnie raportujące pozycję GPS na linii {route.num}.
                      </TooltipContent>
                    </UITooltip>
                  )}

                  {delay !== null && delay > 60 && (
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1.5 text-xs bg-destructive/10 text-destructive px-3 py-1.5 rounded-lg font-medium cursor-help">
                          <Clock size={12} /> Opóźnienie ~{Math.floor(delay / 60)} min
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs space-y-1">
                        <p>Aktualne opóźnienie: <strong>{fmtMin(delay / 60)}</strong></p>
                        {delayHistory.length > 1 && (
                          <p className="text-muted-foreground">
                            Min: {fmtMin(minHist)} · Maks: {fmtMin(maxHist)} · Śr.: {fmtMin(avgHistDelay)}
                          </p>
                        )}
                      </TooltipContent>
                    </UITooltip>
                  )}

                  {alerts.length > 0 && (
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <motion.span
                          key={alerts.map((a) => a.id).join(",")}
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="inline-flex items-center gap-1.5 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-lg font-medium cursor-help"
                        >
                          <AlertTriangle size={12} className="animate-pulse" /> {alerts.length} {alerts.length === 1 ? "alert" : "alertów"}
                        </motion.span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs text-xs space-y-1">
                        <p className="font-semibold">Ostatni alert{lastAlert?.effect ? ` · ${lastAlert.effect}` : ""}</p>
                        {lastAlert && (
                          <>
                            <p className="text-foreground">{lastAlert.headerText}</p>
                            {lastAlert.descriptionText && (
                              <p className="text-muted-foreground line-clamp-3">{lastAlert.descriptionText}</p>
                            )}
                          </>
                        )}
                        {alerts.length > 1 && (
                          <p className="text-muted-foreground/80 pt-1 border-t border-border">
                            +{alerts.length - 1} {alerts.length - 1 === 1 ? "wcześniejszy" : "wcześniejszych"} — zobacz panel poniżej.
                          </p>
                        )}
                      </TooltipContent>
                    </UITooltip>
                  )}
                </TooltipProvider>
              );
            })()}
            <LiveFreshnessBadge lastUpdated={rtData?.lastUpdated ?? null} loading={rtLoading} />
            {usingCached && cachedStatus && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-muted text-muted-foreground"
                title={`Zapisane lokalnie ${new Date(cachedStatus.savedAt).toLocaleString("pl-PL")}`}
              >
                <Clock size={11} /> dane z pamięci
              </span>
            )}
            <QuietModeToggle
              muted={quiet.muted}
              until={quiet.until}
              onToggle={quiet.toggle}
              onMuteFor={quiet.muteFor}
              onUnmute={quiet.unmute}
            />
            <button onClick={refreshRt} disabled={rtLoading} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg transition-colors">
              <RefreshCw size={12} className={rtLoading ? "animate-spin" : ""} /> Odśwież
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* Alerts */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.section className="container mx-auto px-4 py-4" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <motion.div key={alert.id} className="flex gap-3 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{alert.headerText}</p>
                    {alert.descriptionText && <p className="text-xs text-muted-foreground mt-1">{alert.descriptionText}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <AlertHistoryPanel entries={alertHistory} onClear={clearAlertHistory} />

      <div className="container mx-auto px-4 py-6">
        <motion.div className="grid gap-6 lg:grid-cols-2" variants={container} initial="hidden" animate="visible">

          {/* Map */}
          <motion.div variants={item} className="bg-card rounded-xl border overflow-hidden shadow-sm">
            <div className="p-4 border-b flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              <h2 className="font-heading font-bold text-foreground">Mapa trasy</h2>
            </div>
            {positions.length > 1 ? (
              <div className="h-[350px] md:h-[420px]">
                <MapContainer
                  bounds={L.latLngBounds(positions)}
                  boundsOptions={{ padding: [30, 30] }}
                  className="h-full w-full z-0"
                  scrollWheelZoom={false}
                >
                  <FlyToStop position={highlightedPosition} />
                  <TileLayer
                    attribution='&copy; <a href="https://osm.org">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Polyline positions={positions} pathOptions={{ color: routeColor, weight: 4, opacity: 0.8 }} />
                  {route.stops.filter((s) => s.la && s.lo).map((stop, idx) => {
                    const isHighlighted = highlightedStopIdx === idx;
                    const isEndpoint = idx === 0 || idx === route.stops.length - 1;
                    const size = isHighlighted ? 18 : 10;
                    return (
                      <Marker
                        key={`${stop.n}-${idx}`}
                        position={[stop.la, stop.lo]}
                        icon={L.divIcon({
                          className: "",
                          html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${isHighlighted || isEndpoint ? routeColor : '#fff'};border:${isHighlighted ? 3 : 2}px solid ${routeColor};${isHighlighted ? 'box-shadow:0 0 12px ' + routeColor + '80;' : ''}transition:all 0.3s;"></div>`,
                          iconSize: [size, size],
                          iconAnchor: [size / 2, size / 2],
                        })}
                        eventHandlers={{ click: () => handleStopClick(idx) }}
                      >
                        <Popup>{stop.n}</Popup>
                      </Marker>
                    );
                  })}
                  {/* Vehicle markers */}
                  {vehicles.map((v) => (
                    <Marker
                      key={v.vehicleId}
                      position={[v.lat, v.lon]}
                      icon={L.divIcon({
                        className: "",
                        html: `<div style="width:16px;height:16px;border-radius:50%;background:${routeColor};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8],
                      })}
                    >
                      <Popup>Pojazd {v.vehicleId}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                Brak danych lokalizacji przystanków
              </div>
            )}
          </motion.div>

          {/* Frequency chart */}
          <motion.div variants={item} className="bg-card rounded-xl border overflow-hidden shadow-sm">
            <div className="p-4 border-b flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <h2 className="font-heading font-bold text-foreground">Częstotliwość kursowania</h2>
            </div>
            <div className="p-4 h-[300px] md:h-[380px]">
              {frequencyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={frequencyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`${value} kursów`, "Odjazdy"]}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {frequencyData.map((_, idx) => (
                        <Cell key={idx} fill={routeColor} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">Brak danych</div>
              )}
            </div>
          </motion.div>

          {/* Delay chart */}
          {delayChartData.some((d) => d.delay > 0) && (
            <motion.div variants={item} className="bg-card rounded-xl border overflow-hidden shadow-sm lg:col-span-2">
              <div className="p-4 border-b flex items-center gap-2">
                <AlertTriangle size={16} className="text-destructive" />
                <h2 className="font-heading font-bold text-foreground">Opóźnienia na przystankach (min)</h2>
              </div>
              <div className="p-4 h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={delayChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`${value} min`, "Opóźnienie"]}
                    />
                    <Bar dataKey="delay" radius={[4, 4, 0, 0]}>
                      {delayChartData.map((d, idx) => (
                        <Cell key={idx} fill={d.delay > 3 ? "hsl(var(--destructive))" : d.delay > 1 ? "hsl(45, 93%, 58%)" : "hsl(var(--accent))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Delay history trend */}
          <motion.div variants={item} className="bg-card rounded-xl border overflow-hidden shadow-sm lg:col-span-2">
            <div className="p-4 border-b flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                <h2 className="font-heading font-bold text-foreground">Trend opóźnień</h2>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  · ostatnie {delayHistory.length} pomiarów
                </span>
                <AnimatePresence>
                  {delayHistory.length > 0 && (
                    <motion.span
                      key={delayHistory[delayHistory.length - 1].t}
                      initial={{ opacity: 0, scale: 0.6, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ type: "spring", stiffness: 380, damping: 22 }}
                      className="text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary"
                    >
                      +1
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-3">
                <LiveFreshnessBadge lastUpdated={rtData?.lastUpdated ?? null} loading={rtLoading} />
                {delayHistory.length > 0 && (
                  <>
                    <span className="text-xs text-muted-foreground hidden md:inline">
                      śr. <span className="font-semibold text-foreground">{avgHistDelay.toFixed(1)} min</span>
                      {" · "}max <span className="font-semibold text-foreground">{maxHistDelay.toFixed(1)} min</span>
                    </span>
                    <button
                      onClick={clearDelayHistory}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      title="Wyczyść historię"
                    >
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="p-4 h-[260px]">
              {delayHistoryChart.length >= 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={delayHistoryChart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="delayGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={routeColor} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={routeColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      unit=" min"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`${value} min`, "Opóźnienie"]}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
                    <Area
                      type="monotone"
                      dataKey="delay"
                      stroke={routeColor}
                      strokeWidth={2}
                      fill="url(#delayGradient)"
                      isAnimationActive
                      animationDuration={700}
                      animationEasing="ease-out"
                      dot={(props: any) => {
                        const { cx, cy, index, payload } = props;
                        const isLast = index === delayHistoryChart.length - 1;
                        if (!isLast) return <g key={`d-${index}`} />;
                        return (
                          <g key={`d-${index}-${payload.ts}`}>
                            <circle cx={cx} cy={cy} r={8} fill={routeColor} opacity={0.25}>
                              <animate attributeName="r" from="4" to="14" dur="1.4s" repeatCount="indefinite" />
                              <animate attributeName="opacity" from="0.45" to="0" dur="1.4s" repeatCount="indefinite" />
                            </circle>
                            <circle cx={cx} cy={cy} r={4} fill={routeColor} stroke="hsl(var(--card))" strokeWidth={2} />
                          </g>
                        );
                      }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-2">
                  <RefreshCw size={20} className="opacity-50 animate-spin" />
                  <p className="text-sm">Zbieranie danych historycznych…</p>
                  <p className="text-xs">Trend pojawi się po kilku odświeżeniach (co ~10 s)</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Stops timeline */}
        <motion.section className="mt-8" {...fadeUp} transition={{ delay: 0.3 }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
              <MapPin size={18} className="text-primary" /> Przystanki i rozkład jazdy
            </h2>
            <div className="flex-1" />
            <div className="relative max-w-xs w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={stopSearch}
                onChange={(e) => { setStopSearch(e.target.value); setHighlightedStopIdx(null); }}
                placeholder="Szukaj przystanku..."
                className="w-full pl-8 pr-8 py-2 rounded-lg border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              />
              {stopSearch && (
                <button onClick={() => { setStopSearch(""); setHighlightedStopIdx(null); }} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <X size={14} className="text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Search results dropdown */}
          <AnimatePresence>
            {filteredStopIndices && filteredStopIndices.length > 0 && stopSearch.trim() && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="flex flex-wrap gap-1.5">
                  {filteredStopIndices.map((idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => handleStopClick(idx)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        highlightedStopIdx === idx
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <MapPin size={12} />
                      {route.stops[idx].n}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {filteredStopIndices && filteredStopIndices.length === 0 && stopSearch.trim() && (
            <p className="text-sm text-muted-foreground mb-4">Nie znaleziono przystanku „{stopSearch}"</p>
          )}

          <motion.div className="bg-card rounded-xl border p-4 shadow-sm" variants={container} initial="hidden" animate="visible">
            {route.stops.map((stop, idx) => {
              const isExpanded = expandedStop === idx;
              const nextDeps = stop.d.filter((d) => d >= currentTime).slice(0, 6);
              const isFirst = idx === 0;
              const isLast = idx === route.stops.length - 1;
              const isHighlighted = highlightedStopIdx === idx;
              const isFiltered = filteredStopIndices ? filteredStopIndices.includes(idx) : true;

              return (
                <motion.div
                  key={`${stop.n}-${idx}`}
                  ref={(el) => { stopRefs.current[idx] = el; }}
                  className={`relative transition-opacity duration-300 ${!isFiltered ? "opacity-30 pointer-events-none" : ""}`}
                  variants={item}
                >
                  {!isLast && (
                    <div className="absolute left-[19px] top-10 bottom-0 w-0.5" style={{ backgroundColor: `${routeColor}30` }} />
                  )}
                  <button
                    onClick={() => { setExpandedStop(isExpanded ? -1 : idx); handleStopClick(idx); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-all text-left group ${
                      isHighlighted ? "bg-primary/5 ring-1 ring-primary/30" : ""
                    }`}
                  >
                    <motion.div
                      className="relative z-10 shrink-0 rounded-full border-2"
                      style={{
                        width: isHighlighted ? 16 : 12,
                        height: isHighlighted ? 16 : 12,
                        backgroundColor: isHighlighted || isFirst || isLast ? routeColor : "hsl(var(--card))",
                        borderColor: isHighlighted || isFirst || isLast ? routeColor : "hsl(var(--muted-foreground) / 0.4)",
                        boxShadow: isHighlighted ? `0 0 10px ${routeColor}60` : "none",
                      }}
                      whileHover={{ scale: 1.4 }}
                      animate={{ scale: isHighlighted ? [1, 1.3, 1] : 1 }}
                      transition={{ duration: 0.4 }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${isFirst || isLast ? "font-semibold text-foreground" : "text-foreground"}`}>
                        {stop.n}
                      </span>
                      {nextDeps.length > 0 && !isExpanded && (
                        <span className="text-xs text-muted-foreground ml-2">→ {nextDeps[0]}</span>
                      )}
                    </div>
                    {stop.d.length > 0 && (
                      isExpanded
                        ? <ChevronUp size={14} className="text-muted-foreground shrink-0" />
                        : <ChevronDown size={14} className="text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && stop.d.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-10 mr-2 mb-2 overflow-hidden"
                      >
                        <div className="bg-muted/50 rounded-lg p-3 mt-1">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Clock size={14} className="text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Najbliższe odjazdy</span>
                          </div>
                          {nextDeps.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {nextDeps.map((dep, i) => (
                                <motion.span
                                  key={dep}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: i * 0.05 }}
                                  className={`text-sm font-mono px-2.5 py-1 rounded-md font-medium ${
                                    i === 0 ? "text-white" : "bg-card text-foreground border"
                                  }`}
                                  style={i === 0 ? { backgroundColor: routeColor } : undefined}
                                >
                                  {dep}
                                </motion.span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Brak odjazdów na dziś</p>
                          )}
                          <details className="mt-3">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                              Pełny rozkład jazdy
                            </summary>
                            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                              {Object.entries(
                                stop.d.reduce<Record<string, string[]>>((acc, dep) => {
                                  const [hour, min] = dep.split(":");
                                  if (!acc[hour]) acc[hour] = [];
                                  acc[hour].push(min);
                                  return acc;
                                }, {})
                              ).map(([hour, mins]) => (
                                <div key={hour} className="flex gap-2 text-xs">
                                  <span className="font-bold text-foreground w-6 text-right">{hour}</span>
                                  <span className="text-muted-foreground font-mono">{mins.join(" ")}</span>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>
      </div>
    </AppLayout>
  );
};

export default RoutePage;
