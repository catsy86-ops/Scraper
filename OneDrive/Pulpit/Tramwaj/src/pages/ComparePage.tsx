import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowLeftRight, Bus, TrainFront, Clock, AlertTriangle,
  Radio, Search, X, ChevronDown
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { loadGtfsData, type GtfsRoute, type GtfsData } from "@/data/gtfs";
import { fetchGtfsRt, getRouteDelay, getRouteVehicles, getRouteAlerts, type GtfsRtData } from "@/data/gtfs-rt";
import Navbar from "@/components/Navbar";

const fadeUp = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };

const RouteSelector = ({
  routes,
  selected,
  onSelect,
  label,
  side,
}: {
  routes: GtfsRoute[];
  selected: GtfsRoute | null;
  onSelect: (r: GtfsRoute) => void;
  label: string;
  side: "left" | "right";
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      routes.filter(
        (r) =>
          r.num.toLowerCase().includes(search.toLowerCase()) ||
          r.name.toLowerCase().includes(search.toLowerCase())
      ),
    [routes, search]
  );

  return (
    <div className="relative">
      <p className="text-xs text-muted-foreground mb-1.5 font-medium">{label}</p>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-card hover:bg-muted/50 transition-colors text-left"
      >
        {selected ? (
          <>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white"
              style={{ backgroundColor: `#${selected.color}` }}
            >
              {selected.num}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{selected.name}</p>
              <p className="text-xs text-muted-foreground truncate">{selected.from} → {selected.to}</p>
            </div>
          </>
        ) : (
          <span className="text-muted-foreground text-sm flex-1">Wybierz linię...</span>
        )}
        <ChevronDown size={16} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 top-full mt-1 ${side === "right" ? "right-0" : "left-0"} w-full min-w-[260px] max-h-[320px] bg-card border rounded-xl shadow-xl overflow-hidden`}
          >
            <div className="p-2 border-b">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/50">
                <Search size={14} className="text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Szukaj linii..."
                  className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground"
                  autoFocus
                />
                {search && (
                  <button onClick={() => setSearch("")}>
                    <X size={12} className="text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto max-h-[250px] p-1">
              {filtered.map((route) => (
                <button
                  key={route.id}
                  onClick={() => { onSelect(route); setOpen(false); setSearch(""); }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs text-white shrink-0"
                    style={{ backgroundColor: `#${route.color}` }}
                  >
                    {route.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{route.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{route.from} → {route.to}</p>
                  </div>
                  {route.type === "tram" ? (
                    <TrainFront size={14} className="text-muted-foreground shrink-0" />
                  ) : (
                    <Bus size={14} className="text-muted-foreground shrink-0" />
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Brak wyników</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface RouteStats {
  route: GtfsRoute;
  delay: number | null;
  vehicleCount: number;
  alertCount: number;
  totalDepartures: number;
  peakHour: string;
  peakCount: number;
  stopCount: number;
  delayChartData: { name: string; delay: number }[];
  frequencyData: { hour: string; count: number }[];
}

function computeStats(route: GtfsRoute, rtData: GtfsRtData | null): RouteStats {
  const delay = rtData ? getRouteDelay(route.id, rtData.tripUpdates) : null;
  const vehicles = rtData ? getRouteVehicles(route.id, rtData.vehicles) : [];
  const alerts = rtData ? getRouteAlerts(route.id, rtData.alerts) : [];

  const hours: Record<number, number> = {};
  route.stops[0]?.d.forEach((dep) => {
    const h = parseInt(dep.split(":")[0]);
    hours[h] = (hours[h] || 0) + 1;
  });
  const frequencyData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}:00`,
    count: hours[h] || 0,
  })).filter((d) => d.count > 0);

  let peakHour = "";
  let peakCount = 0;
  Object.entries(hours).forEach(([h, c]) => {
    if (c > peakCount) { peakHour = `${h}:00`; peakCount = c; }
  });

  const totalDepartures = route.stops[0]?.d.length ?? 0;

  const routeTrips = rtData?.tripUpdates.filter((t) => t.routeId === route.id) ?? [];
  const delayChartData = route.stops.slice(0, 15).map((stop, idx) => {
    const delays = routeTrips
      .flatMap((t) => t.stopUpdates.filter((s) => s.stopId === stop.n || s.stopId === `${idx}`))
      .map((s) => s.departureDelay);
    const avg = delays.length > 0 ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length / 60) : 0;
    return { name: stop.n.length > 10 ? stop.n.slice(0, 10) + "…" : stop.n, delay: Math.max(avg, 0) };
  });

  return {
    route,
    delay,
    vehicleCount: vehicles.length,
    alertCount: alerts.length,
    totalDepartures,
    peakHour,
    peakCount,
    stopCount: route.stops.length,
    delayChartData,
    frequencyData,
  };
}

const StatCard = ({ label, valueA, valueB, colorA, colorB, unit = "" }: {
  label: string; valueA: string | number; valueB: string | number; colorA: string; colorB: string; unit?: string;
}) => (
  <motion.div
    className="bg-card rounded-xl border p-4 shadow-sm"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <p className="text-xs text-muted-foreground mb-3 font-medium">{label}</p>
    <div className="flex items-end justify-between gap-2">
      <div className="text-center flex-1">
        <p className="text-2xl font-bold font-heading" style={{ color: colorA }}>{valueA}{unit}</p>
      </div>
      <span className="text-muted-foreground text-xs mb-1">vs</span>
      <div className="text-center flex-1">
        <p className="text-2xl font-bold font-heading" style={{ color: colorB }}>{valueB}{unit}</p>
      </div>
    </div>
  </motion.div>
);

const ComparePage = () => {
  const [data, setData] = useState<GtfsData | null>(null);
  const [rtData, setRtData] = useState<GtfsRtData | null>(null);
  const [routeA, setRouteA] = useState<GtfsRoute | null>(null);
  const [routeB, setRouteB] = useState<GtfsRoute | null>(null);

  useEffect(() => { loadGtfsData().then(setData); }, []);
  useEffect(() => {
    fetchGtfsRt().then(setRtData);
    const iv = setInterval(() => fetchGtfsRt().then(setRtData), 30_000);
    return () => clearInterval(iv);
  }, []);

  const statsA = useMemo(() => routeA ? computeStats(routeA, rtData) : null, [routeA, rtData]);
  const statsB = useMemo(() => routeB ? computeStats(routeB, rtData) : null, [routeB, rtData]);

  const colorA = routeA ? `#${routeA.color}` : "hsl(var(--primary))";
  const colorB = routeB ? `#${routeB.color}` : "hsl(var(--accent))";

  // Merged frequency chart
  const mergedFrequency = useMemo(() => {
    if (!statsA || !statsB) return [];
    const allHours = new Set([
      ...statsA.frequencyData.map((d) => d.hour),
      ...statsB.frequencyData.map((d) => d.hour),
    ]);
    return Array.from(allHours)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((hour) => ({
        hour,
        a: statsA.frequencyData.find((d) => d.hour === hour)?.count ?? 0,
        b: statsB.frequencyData.find((d) => d.hour === hour)?.count ?? 0,
      }));
  }, [statsA, statsB]);

  // Radar data
  const radarData = useMemo(() => {
    if (!statsA || !statsB) return [];
    const maxStops = Math.max(statsA.stopCount, statsB.stopCount) || 1;
    const maxDep = Math.max(statsA.totalDepartures, statsB.totalDepartures) || 1;
    const maxVeh = Math.max(statsA.vehicleCount, statsB.vehicleCount) || 1;
    const maxPeak = Math.max(statsA.peakCount, statsB.peakCount) || 1;
    return [
      { metric: "Przystanki", a: (statsA.stopCount / maxStops) * 100, b: (statsB.stopCount / maxStops) * 100 },
      { metric: "Kursy/dzień", a: (statsA.totalDepartures / maxDep) * 100, b: (statsB.totalDepartures / maxDep) * 100 },
      { metric: "Pojazdy", a: (statsA.vehicleCount / maxVeh) * 100, b: (statsB.vehicleCount / maxVeh) * 100 },
      { metric: "Szczyt", a: (statsA.peakCount / maxPeak) * 100, b: (statsB.peakCount / maxPeak) * 100 },
      { metric: "Punktualność", a: statsA.delay !== null ? Math.max(100 - (statsA.delay / 60) * 10, 0) : 100, b: statsB.delay !== null ? Math.max(100 - (statsB.delay / 60) * 10, 0) : 100 },
    ];
  }, [statsA, statsB]);

  const routes = data?.routes ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <motion.section className="py-8 md:py-12" {...fadeUp}>
        <div className="container mx-auto px-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={16} /> Powrót
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <ArrowLeftRight size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                Porównanie linii
              </h1>
              <p className="text-sm text-muted-foreground">Wybierz dwie linie, aby porównać statystyki i opóźnienia</p>
            </div>
          </div>

          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <RouteSelector routes={routes} selected={routeA} onSelect={setRouteA} label="Linia A" side="left" />
            <RouteSelector routes={routes} selected={routeB} onSelect={setRouteB} label="Linia B" side="right" />
          </div>

          <AnimatePresence mode="wait">
            {statsA && statsB ? (
              <motion.div
                key={`${routeA!.id}-${routeB!.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <StatCard
                    label="Przystanki"
                    valueA={statsA.stopCount}
                    valueB={statsB.stopCount}
                    colorA={colorA}
                    colorB={colorB}
                  />
                  <StatCard
                    label="Kursy/dzień"
                    valueA={statsA.totalDepartures}
                    valueB={statsB.totalDepartures}
                    colorA={colorA}
                    colorB={colorB}
                  />
                  <StatCard
                    label="Pojazdy na trasie"
                    valueA={statsA.vehicleCount}
                    valueB={statsB.vehicleCount}
                    colorA={colorA}
                    colorB={colorB}
                  />
                  <StatCard
                    label="Śr. opóźnienie"
                    valueA={statsA.delay !== null ? Math.round(statsA.delay / 60) : "—"}
                    valueB={statsB.delay !== null ? Math.round(statsB.delay / 60) : "—"}
                    colorA={colorA}
                    colorB={colorB}
                    unit=" min"
                  />
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 mb-6 justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colorA }} />
                    <span className="text-sm font-medium text-foreground">Linia {routeA!.num}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colorB }} />
                    <span className="text-sm font-medium text-foreground">Linia {routeB!.num}</span>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Frequency comparison */}
                  <motion.div
                    className="bg-card rounded-xl border overflow-hidden shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="p-4 border-b flex items-center gap-2">
                      <Clock size={16} className="text-primary" />
                      <h2 className="font-heading font-bold text-foreground">Częstotliwość kursowania</h2>
                    </div>
                    <div className="p-4 h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mergedFrequency} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: 12,
                            }}
                            formatter={(value: number, name: string) => [
                              `${value} kursów`,
                              name === "a" ? `Linia ${routeA!.num}` : `Linia ${routeB!.num}`,
                            ]}
                          />
                          <Bar dataKey="a" fill={colorA} radius={[4, 4, 0, 0]} opacity={0.85} />
                          <Bar dataKey="b" fill={colorB} radius={[4, 4, 0, 0]} opacity={0.85} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* Radar comparison */}
                  <motion.div
                    className="bg-card rounded-xl border overflow-hidden shadow-sm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="p-4 border-b flex items-center gap-2">
                      <Radio size={16} className="text-primary" />
                      <h2 className="font-heading font-bold text-foreground">Porównanie ogólne</h2>
                    </div>
                    <div className="p-4 h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                          <PolarRadiusAxis tick={false} domain={[0, 100]} />
                          <Radar name={`Linia ${routeA!.num}`} dataKey="a" stroke={colorA} fill={colorA} fillOpacity={0.25} strokeWidth={2} />
                          <Radar name={`Linia ${routeB!.num}`} dataKey="b" stroke={colorB} fill={colorB} fillOpacity={0.25} strokeWidth={2} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: 12,
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* Delay chart A */}
                  <motion.div
                    className="bg-card rounded-xl border overflow-hidden shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="p-4 border-b flex items-center gap-2">
                      <AlertTriangle size={16} style={{ color: colorA }} />
                      <h2 className="font-heading font-bold text-foreground">Opóźnienia – Linia {routeA!.num}</h2>
                    </div>
                    <div className="p-4 h-[250px]">
                      {statsA.delayChartData.some((d) => d.delay > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statsA.delayChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} angle={-30} textAnchor="end" height={55} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                              formatter={(v: number) => [`${v} min`, "Opóźnienie"]}
                            />
                            <Bar dataKey="delay" radius={[4, 4, 0, 0]}>
                              {statsA.delayChartData.map((d, i) => (
                                <Cell key={i} fill={d.delay > 3 ? "hsl(var(--destructive))" : d.delay > 1 ? "hsl(45, 93%, 58%)" : colorA} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Brak danych o opóźnieniach</div>
                      )}
                    </div>
                  </motion.div>

                  {/* Delay chart B */}
                  <motion.div
                    className="bg-card rounded-xl border overflow-hidden shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="p-4 border-b flex items-center gap-2">
                      <AlertTriangle size={16} style={{ color: colorB }} />
                      <h2 className="font-heading font-bold text-foreground">Opóźnienia – Linia {routeB!.num}</h2>
                    </div>
                    <div className="p-4 h-[250px]">
                      {statsB.delayChartData.some((d) => d.delay > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statsB.delayChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} angle={-30} textAnchor="end" height={55} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                              formatter={(v: number) => [`${v} min`, "Opóźnienie"]}
                            />
                            <Bar dataKey="delay" radius={[4, 4, 0, 0]}>
                              {statsB.delayChartData.map((d, i) => (
                                <Cell key={i} fill={d.delay > 3 ? "hsl(var(--destructive))" : d.delay > 1 ? "hsl(45, 93%, 58%)" : colorB} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Brak danych o opóźnieniach</div>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <ArrowLeftRight size={48} className="text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Wybierz dwie linie powyżej, aby zobaczyć porównanie</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </div>
  );
};

export default ComparePage;
