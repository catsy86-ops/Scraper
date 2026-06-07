import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin, RefreshCw, TrainFront, Bus, Locate, Crosshair, X,
  ChevronDown, Clock, Gauge, List, Map as MapIcon, ArrowUpDown, Search
} from "lucide-react";
import { fetchGtfsRt, getRouteDelay, type VehiclePosition, type GtfsRtData } from "@/data/gtfs-rt";
import AnimatedVehicleMarker from "./AnimatedVehicleMarker";
import LiveFreshnessBadge from "./LiveFreshnessBadge";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const SZCZECIN_CENTER: [number, number] = [53.4285, 14.5528];

function createVehicleIcon(type: "tram" | "bus", tracked = false) {
  const color = type === "tram" ? "#0284c7" : "#dc2626";
  const size = tracked ? 36 : 28;
  const r = tracked ? 18 : 14;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${tracked ? `<circle cx="${r}" cy="${r}" r="${r - 1}" fill="none" stroke="#facc15" stroke-width="3" opacity="0.8"/>` : ""}
    <circle cx="${r}" cy="${r}" r="${tracked ? 11 : 12}" fill="${color}" stroke="white" stroke-width="2.5"/>
    <text x="${r}" y="${r + 4}" text-anchor="middle" fill="white" font-size="13" font-weight="bold" font-family="sans-serif">${type === "tram" ? "T" : "A"}</text>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [size, size], iconAnchor: [r, r], popupAnchor: [0, -r] });
}

const tramIcon = createVehicleIcon("tram");
const busIcon = createVehicleIcon("bus");
const tramIconTracked = createVehicleIcon("tram", true);
const busIconTracked = createVehicleIcon("bus", true);

function isTramRoute(routeId: string): boolean {
  const num = parseInt(routeId, 10);
  return !isNaN(num) && num >= 1 && num <= 12;
}

function FollowVehicle({ vehicle }: { vehicle: VehiclePosition | null }) {
  const map = useMap();
  useEffect(() => {
    if (vehicle) {
      map.setView([vehicle.lat, vehicle.lon], Math.max(map.getZoom(), 15), { animate: true });
    }
  }, [vehicle?.lat, vehicle?.lon, map]);
  return null;
}

function RecenterButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-3 right-3 z-[1000] bg-card border shadow-md rounded-lg p-2 hover:bg-muted transition-colors"
      title="Wycentruj mapę"
    >
      <Locate size={18} className="text-foreground" />
    </button>
  );
}

function formatDelay(seconds: number): string {
  if (seconds <= 30) return "OK";
  const min = Math.round(seconds / 60);
  return `+${min} min`;
}

type ViewMode = "map" | "list";
type SortMode = "route" | "speed" | "delay";

const TransitMap = () => {
  const [rtData, setRtData] = useState<GtfsRtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "tram" | "bus">("all");
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [trackedId, setTrackedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [sortMode, setSortMode] = useState<SortMode>("route");
  const [routeSearchQuery, setRouteSearchQuery] = useState("");
  const [routeDropdownOpen, setRouteDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const vehicles = rtData?.vehicles ?? [];
  const tripUpdates = rtData?.tripUpdates ?? [];
  const lastUpdated = rtData?.lastUpdated ?? null;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rt = await fetchGtfsRt();
      setRtData(rt);
    } finally {
      setLoading(false);
    }
  }, []);

  // Live polling: 8s interval, paused while tab hidden, immediate refresh on visibility return
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (interval) return;
      interval = setInterval(refresh, 8_000);
    };
    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        refresh();
        start();
      }
    };
    refresh();
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRouteDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Available routes from vehicles
  const availableRoutes = useMemo(() => {
    const routeSet = new Map<string, { id: string; count: number; isTram: boolean }>();
    vehicles.forEach((v) => {
      const existing = routeSet.get(v.routeId);
      if (existing) existing.count++;
      else routeSet.set(v.routeId, { id: v.routeId, count: 1, isTram: isTramRoute(v.routeId) });
    });
    return Array.from(routeSet.values()).sort((a, b) => {
      const aNum = parseInt(a.id), bNum = parseInt(b.id);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return a.id.localeCompare(b.id);
    });
  }, [vehicles]);

  const filteredRoutes = useMemo(() => {
    if (!routeSearchQuery) return availableRoutes;
    const q = routeSearchQuery.toLowerCase();
    return availableRoutes.filter((r) => r.id.toLowerCase().includes(q));
  }, [availableRoutes, routeSearchQuery]);

  const filtered = useMemo(() => {
    let result = vehicles;
    if (filter === "tram") result = result.filter((v) => isTramRoute(v.routeId));
    else if (filter === "bus") result = result.filter((v) => !isTramRoute(v.routeId));
    if (selectedRoute) result = result.filter((v) => v.routeId === selectedRoute);
    return result;
  }, [vehicles, filter, selectedRoute]);

  const trackedVehicle = useMemo(
    () => (trackedId ? vehicles.find((v) => v.vehicleId === trackedId) ?? null : null),
    [vehicles, trackedId]
  );

  useEffect(() => {
    if (trackedId && vehicles.length > 0 && !vehicles.find((v) => v.vehicleId === trackedId)) {
      setTrackedId(null);
    }
  }, [vehicles, trackedId]);

  const tramCount = useMemo(() => vehicles.filter((v) => isTramRoute(v.routeId)).length, [vehicles]);
  const busCount = useMemo(() => vehicles.filter((v) => !isTramRoute(v.routeId)).length, [vehicles]);

  // Sorted list for list view
  const sortedVehicles = useMemo(() => {
    const list = [...filtered];
    switch (sortMode) {
      case "route":
        return list.sort((a, b) => {
          const aNum = parseInt(a.routeId), bNum = parseInt(b.routeId);
          if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
          return a.routeId.localeCompare(b.routeId);
        });
      case "speed":
        return list.sort((a, b) => (b.speed ?? 0) - (a.speed ?? 0));
      case "delay": {
        const delayMap = new Map<string, number>();
        tripUpdates.forEach((t) => {
          const maxDelay = Math.max(...t.stopUpdates.map((s) => s.departureDelay), 0);
          const existing = delayMap.get(t.routeId) ?? 0;
          if (maxDelay > existing) delayMap.set(t.routeId, maxDelay);
        });
        return list.sort((a, b) => (delayMap.get(b.routeId) ?? 0) - (delayMap.get(a.routeId) ?? 0));
      }
      default:
        return list;
    }
  }, [filtered, sortMode, tripUpdates]);

  const handleTrack = (vehicleId: string) => {
    setTrackedId((prev) => (prev === vehicleId ? null : vehicleId));
    setViewMode("map");
  };

  return (
    <section id="mapa" className="container mx-auto px-4 py-12">
      <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10">
          <MapPin className="text-accent" size={22} />
        </div>
        Mapa pojazdów na żywo
      </h2>

      {/* Controls row 1: type filter + route selector + view toggle */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Type filter */}
        <div className="flex rounded-lg border overflow-hidden bg-card">
          {([
            ["all", "Wszystkie", null, vehicles.length],
            ["tram", "Tramwaje", <TrainFront size={14} key="t" />, tramCount],
            ["bus", "Autobusy", <Bus size={14} key="b" />, busCount],
          ] as const).map(([key, label, icon, count]) => (
            <button
              key={key}
              onClick={() => { setFilter(key as typeof filter); setSelectedRoute(null); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                filter === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
              <span className={`text-xs ${filter === key ? "text-primary-foreground/80" : "text-muted-foreground/60"}`}>
                ({count})
              </span>
            </button>
          ))}
        </div>

        {/* Route dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setRouteDropdownOpen(!routeDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              selectedRoute
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {selectedRoute ? (
              <>
                {isTramRoute(selectedRoute) ? <TrainFront size={14} /> : <Bus size={14} />}
                Linia {selectedRoute}
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedRoute(null); }}
                  className="ml-1 hover:text-destructive"
                >
                  <X size={12} />
                </button>
              </>
            ) : (
              <>
                <Search size={14} />
                Wybierz linię
                <ChevronDown size={12} />
              </>
            )}
          </button>

          {routeDropdownOpen && (
            <div className="absolute z-50 top-full mt-1.5 left-0 w-64 bg-popover border rounded-xl shadow-xl overflow-hidden">
              <div className="p-2 border-b">
                <input
                  type="text"
                  value={routeSearchQuery}
                  onChange={(e) => setRouteSearchQuery(e.target.value)}
                  placeholder="Szukaj linii..."
                  className="w-full text-sm bg-background border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
              </div>
              <div className="max-h-52 overflow-y-auto">
                {selectedRoute && (
                  <button
                    onClick={() => { setSelectedRoute(null); setRouteDropdownOpen(false); setRouteSearchQuery(""); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors text-muted-foreground"
                  >
                    Pokaż wszystkie
                  </button>
                )}
                {filteredRoutes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedRoute(r.id); setRouteDropdownOpen(false); setRouteSearchQuery(""); }}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                      selectedRoute === r.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {r.isTram ? <TrainFront size={14} className="text-tram shrink-0" /> : <Bus size={14} className="text-bus shrink-0" />}
                    <span className="font-heading font-semibold">Linia {r.id}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{r.count} poj.</span>
                  </button>
                ))}
                {filteredRoutes.length === 0 && (
                  <p className="px-4 py-3 text-sm text-muted-foreground text-center">Brak wyników</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* View toggle + refresh */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex rounded-lg border overflow-hidden bg-card">
            <button
              onClick={() => setViewMode("map")}
              className={`p-2 transition-colors ${viewMode === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              title="Widok mapy"
            >
              <MapIcon size={14} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              title="Widok listy"
            >
              <List size={14} />
            </button>
          </div>

          <LiveFreshnessBadge lastUpdated={lastUpdated} loading={loading} />
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 rounded-lg border bg-card hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Tracking banner */}
      {trackedVehicle && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 rounded-lg border bg-secondary/10 border-secondary/30 text-sm">
          <Crosshair size={16} className="text-secondary-foreground shrink-0 animate-pulse" />
          <span className="text-foreground font-medium">
            Śledzisz: {isTramRoute(trackedVehicle.routeId) ? "🚊" : "🚌"} Linia {trackedVehicle.routeId}
            <span className="text-muted-foreground font-normal ml-1.5">
              (pojazd {trackedVehicle.vehicleId}
              {trackedVehicle.speed != null && ` · ${Math.round(trackedVehicle.speed * 3.6)} km/h`})
            </span>
          </span>
          <button
            onClick={() => setTrackedId(null)}
            className="ml-auto p-1 rounded hover:bg-secondary/20 transition-colors text-muted-foreground"
            title="Przestań śledzić"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Map view */}
      {viewMode === "map" && (
        <div className="bg-card rounded-xl border overflow-hidden shadow-sm relative">
          <MapContainer
            center={SZCZECIN_CENTER}
            zoom={13}
            style={{ height: "500px", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterButton onClick={() => setTrackedId(null)} />
            <FollowVehicle vehicle={trackedVehicle} />
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={40}
              spiderfyOnMaxZoom
              showCoverageOnHover={false}
              iconCreateFunction={(cluster: any) => {
                const count = cluster.getChildCount();
                const size = count < 10 ? 36 : count < 50 ? 44 : 52;
                return L.divIcon({
                  html: `<div style="
                    width:${size}px;height:${size}px;
                    display:flex;align-items:center;justify-content:center;
                    border-radius:50%;
                    background:hsl(199 89% 38% / 0.85);
                    color:white;font-weight:700;font-size:${count < 10 ? 13 : 12}px;
                    border:3px solid white;
                    box-shadow:0 2px 8px rgba(0,0,0,0.25);
                    font-family:sans-serif;
                  ">${count}</div>`,
                  className: "",
                  iconSize: [size, size],
                  iconAnchor: [size / 2, size / 2],
                });
              }}
            >
              {filtered.map((v) => {
                const isTram = isTramRoute(v.routeId);
                const isTracked = v.vehicleId === trackedId;
                return (
                  <AnimatedVehicleMarker
                    key={v.vehicleId}
                    position={[v.lat, v.lon]}
                    icon={isTracked ? (isTram ? tramIconTracked : busIconTracked) : (isTram ? tramIcon : busIcon)}
                    zIndexOffset={isTracked ? 1000 : 0}
                    duration={1500}
                  >
                    <Popup>
                      <VehiclePopup vehicle={v} isTracked={isTracked} delay={getRouteDelay(v.routeId, tripUpdates)} onTrack={handleTrack} />
                  </Popup>
                </AnimatedVehicleMarker>
              );
            })}
            </MarkerClusterGroup>
          </MapContainer>
          {filtered.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10">
              <p className="text-muted-foreground text-sm">
                {selectedRoute ? `Brak pojazdów na linii ${selectedRoute}` : "Brak danych o pojazdach — spróbuj odświeżyć"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* List view */}
      {viewMode === "list" && (
        <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
          {/* Sort controls */}
          <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
            <ArrowUpDown size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Sortuj:</span>
            {([
              ["route", "Linia"],
              ["speed", "Prędkość"],
              ["delay", "Opóźnienie"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSortMode(key)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                  sortMode === key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">{filtered.length} pojazdów</span>
          </div>

          {/* Vehicle rows */}
          <div className="max-h-[500px] overflow-y-auto divide-y divide-border/50">
            {sortedVehicles.map((v) => {
              const isTram = isTramRoute(v.routeId);
              const delay = getRouteDelay(v.routeId, tripUpdates);
              const isTracked = v.vehicleId === trackedId;
              return (
                <div
                  key={v.vehicleId}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${
                    isTracked ? "bg-secondary/5 border-l-2 border-l-secondary" : ""
                  }`}
                >
                  {/* Route badge */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg font-heading font-bold text-sm shrink-0 ${
                    isTram ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                  }`}>
                    {v.routeId}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isTram ? <TrainFront size={12} className="text-primary shrink-0" /> : <Bus size={12} className="text-destructive shrink-0" />}
                      <span className="text-sm font-medium text-foreground">
                        Linia {v.routeId}
                      </span>
                      <span className="text-xs text-muted-foreground">· {v.vehicleId}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {v.speed != null && (
                        <span className="flex items-center gap-1">
                          <Gauge size={11} /> {Math.round(v.speed * 3.6)} km/h
                        </span>
                      )}
                      {delay !== null && (
                        <span className={`flex items-center gap-1 ${delay > 120 ? "text-destructive" : "text-accent"}`}>
                          <Clock size={11} /> {formatDelay(delay)}
                        </span>
                      )}
                      <span>
                        {v.timestamp ? new Date(v.timestamp * 1000).toLocaleTimeString("pl-PL") : ""}
                      </span>
                    </div>
                  </div>

                  {/* Track button */}
                  <button
                    onClick={() => handleTrack(v.vehicleId)}
                    className={`p-2 rounded-lg transition-colors shrink-0 ${
                      isTracked
                        ? "bg-secondary/20 text-secondary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-primary"
                    }`}
                    title={isTracked ? "Przestań śledzić" : "Śledź na mapie"}
                  >
                    <Crosshair size={16} />
                  </button>
                </div>
              );
            })}
            {sortedVehicles.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Brak pojazdów do wyświetlenia
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

const VehiclePopup = ({
  vehicle: v,
  isTracked,
  delay,
  onTrack,
}: {
  vehicle: VehiclePosition;
  isTracked: boolean;
  delay: number | null;
  onTrack: (id: string) => void;
}) => {
  const isTram = isTramRoute(v.routeId);
  return (
    <div className="text-sm min-w-[170px]">
      <div className="font-bold text-base flex items-center gap-1.5 mb-1">
        {isTram ? "🚊" : "🚌"} Linia {v.routeId}
      </div>
      <div className="text-xs space-y-0.5 mb-2" style={{ color: "#666" }}>
        <p>Pojazd: {v.vehicleId}</p>
        {v.speed != null && <p>Prędkość: {Math.round(v.speed * 3.6)} km/h</p>}
        {v.bearing != null && <p>Kierunek: {Math.round(v.bearing)}°</p>}
        {delay !== null && (
          <p style={{ color: delay > 120 ? "#dc2626" : "#059669" }}>
            Opóźnienie: {formatDelay(delay)}
          </p>
        )}
        <p>
          Akt.:{" "}
          {v.timestamp ? new Date(v.timestamp * 1000).toLocaleTimeString("pl-PL") : "—"}
        </p>
      </div>
      <button
        onClick={() => onTrack(v.vehicleId)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 500,
          border: "none",
          cursor: "pointer",
          backgroundColor: isTracked ? "#fef3c7" : "#eff6ff",
          color: isTracked ? "#92400e" : "#1d4ed8",
        }}
      >
        <Crosshair size={12} />
        {isTracked ? "Przestań śledzić" : "Śledź pojazd"}
      </button>
    </div>
  );
};

export default TransitMap;
