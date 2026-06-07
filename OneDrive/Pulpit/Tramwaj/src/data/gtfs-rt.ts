import GtfsRealtimeBindings from "gtfs-realtime-bindings";

const RT_BASE = "https://www.zditm.szczecin.pl/storage/gtfs";
const TRIPS_URL = `${RT_BASE}/gtfs-rt-trips.pb`;
const VEHICLES_URL = `${RT_BASE}/gtfs-rt-vehicles.pb`;
const ALERTS_URL = `${RT_BASE}/gtfs-rt-alerts.pb`;

/**
 * In development, Vite proxies /api/gtfs-rt/* to ZDiTM — bypasses CORS entirely.
 * In production, we fall back to public CORS proxies.
 */
const isDev = import.meta.env.DEV;
const LOCAL_RT_BASE = "/api/gtfs-rt";
const LOCAL_TRIPS_URL = `${LOCAL_RT_BASE}/gtfs-rt-trips.pb`;
const LOCAL_VEHICLES_URL = `${LOCAL_RT_BASE}/gtfs-rt-vehicles.pb`;
const LOCAL_ALERTS_URL = `${LOCAL_RT_BASE}/gtfs-rt-alerts.pb`;

/**
 * CORS proxies for production builds (where Vite proxy isn't available).
 * These are tested and known to work with binary .pb files.
 */
type ProxyMode = "raw" | "encoded";
interface ProxyDef {
  name: string;
  build: (url: string) => string;
  mode: ProxyMode;
}
const PROXIES: ProxyDef[] = [
  { name: "codetabs", build: (u) => `https://api.codetabs.com/v1/proxy/?quest=${u}`, mode: "raw" },
  { name: "allorigins", build: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, mode: "encoded" },
];

export interface TripUpdate {
  tripId: string;
  routeId: string;
  startDate?: string;
  startTime?: string;
  vehicleId?: string;
  timestamp?: number;
  stopUpdates: {
    stopId: string;
    stopSequence?: number;
    arrivalDelay: number; // seconds
    departureDelay: number;
  }[];
}

export interface VehiclePosition {
  vehicleId: string;
  label?: string;
  tripId: string;
  routeId: string;
  lat: number;
  lon: number;
  bearing?: number;
  speed?: number;
  timestamp: number;
}

export interface ServiceAlert {
  id: string;
  headerText: string;
  descriptionText: string;
  routeIds: string[];
  stopIds: string[];
  activePeriods: { start: number; end: number }[];
  cause: string;
  effect: string;
}

export interface GtfsRtData {
  tripUpdates: TripUpdate[];
  vehicles: VehiclePosition[];
  alerts: ServiceAlert[];
  lastUpdated: Date;
  feedTimestamps: { trips?: number; vehicles?: number; alerts?: number };
  errors?: { trips?: string; vehicles?: string; alerts?: string };
}

/** In dev: fetch directly via Vite proxy. In prod: race CORS proxies. */
async function fetchPb(url: string, localUrl?: string, timeoutMs = 7000): Promise<Uint8Array> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  // In development, just use the Vite proxy — no CORS issues
  if (isDev && localUrl) {
    try {
      const res = await fetch(localUrl, { signal: ctrl.signal, cache: "no-store" });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`local proxy HTTP ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength < 8) throw new Error("empty body");
      return buf;
    } catch (e) {
      clearTimeout(timer);
      throw new Error(`Dev proxy failed: ${(e as Error).message}`);
    }
  }

  // Production: race direct + CORS proxies
  const candidates = [
    { name: "direct", url },
    ...PROXIES.map((p) => ({ name: p.name, url: p.build(url) })),
  ];

  const errors: string[] = [];
  let resolved = false;

  return new Promise<Uint8Array>((resolve, reject) => {
    let pending = candidates.length;
    candidates.forEach((c) => {
      fetch(c.url, { signal: ctrl.signal, cache: "no-store" })
        .then(async (res) => {
          if (resolved) return;
          if (!res.ok) throw new Error(`${c.name} HTTP ${res.status}`);
          const buf = new Uint8Array(await res.arrayBuffer());
          if (buf.byteLength < 8) throw new Error(`${c.name} empty body`);
          resolved = true;
          clearTimeout(timer);
          ctrl.abort();
          resolve(buf);
        })
        .catch((e) => {
          errors.push(`${c.name}: ${(e as Error).message}`);
        })
        .finally(() => {
          pending--;
          if (!resolved && pending === 0) {
            clearTimeout(timer);
            reject(new Error(`All sources failed for ${url.split("/").pop()}: ${errors.join(" | ")}`));
          }
        });
    });
  });
}

function extractText(translatedString: any): string {
  if (!translatedString?.translation?.length) return "";
  const pl = translatedString.translation.find((t: any) => t.language === "pl");
  return (pl?.text || translatedString.translation[0]?.text || "").toString().trim();
}

// GTFS-realtime spec enum mappings (1-indexed, per Alert.Cause / Alert.Effect)
const causeMap: Record<number, string> = {
  1: "Nieznana przyczyna",
  2: "Inna przyczyna",
  3: "Awaria techniczna",
  4: "Strajk",
  5: "Demonstracja",
  6: "Wypadek",
  7: "Dni wolne",
  8: "Pogoda",
  9: "Konserwacja",
  10: "Roboty drogowe",
  11: "Działania policji",
  12: "Nagły wypadek medyczny",
};
const effectMap: Record<number, string> = {
  1: "Brak usługi",
  2: "Zmniejszona częstotliwość",
  3: "Znaczne opóźnienia",
  4: "Objazd",
  5: "Dodatkowy kurs",
  6: "Zmodyfikowana usługa",
  7: "Inny skutek",
  8: "Nieznany skutek",
  9: "Przystanek przeniesiony",
  10: "Bez wpływu",
  11: "Utrudnienia w dostępności",
};

const decodeFeed = (buf: Uint8Array) =>
  GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buf);

export async function fetchGtfsRt(): Promise<GtfsRtData> {
  const result: GtfsRtData = {
    tripUpdates: [],
    vehicles: [],
    alerts: [],
    lastUpdated: new Date(),
    feedTimestamps: {},
    errors: {},
  };

  const [tripsRes, vehiclesRes, alertsRes] = await Promise.allSettled([
    fetchPb(TRIPS_URL, LOCAL_TRIPS_URL),
    fetchPb(VEHICLES_URL, LOCAL_VEHICLES_URL),
    fetchPb(ALERTS_URL, LOCAL_ALERTS_URL),
  ]);

  if (tripsRes.status === "fulfilled") {
    try {
      const feed = decodeFeed(tripsRes.value);
      result.feedTimestamps.trips = Number(feed.header?.timestamp ?? 0) || undefined;
      result.tripUpdates = feed.entity
        .filter((e: any) => e.tripUpdate)
        .map((e: any) => {
          const tu = e.tripUpdate;
          return {
            tripId: tu.trip?.tripId || "",
            routeId: tu.trip?.routeId || "",
            startDate: tu.trip?.startDate || undefined,
            startTime: tu.trip?.startTime || undefined,
            vehicleId: tu.vehicle?.id || tu.vehicle?.label || undefined,
            timestamp: Number(tu.timestamp || 0) || undefined,
            stopUpdates: (tu.stopTimeUpdate || []).map((stu: any) => ({
              stopId: stu.stopId || "",
              stopSequence: stu.stopSequence ?? undefined,
              arrivalDelay: Number(stu.arrival?.delay ?? 0),
              departureDelay: Number(stu.departure?.delay ?? stu.arrival?.delay ?? 0),
            })),
          } as TripUpdate;
        });
    } catch (e) {
      result.errors!.trips = `decode: ${(e as Error).message}`;
      console.warn("[gtfs-rt] trips decode failed", e);
    }
  } else {
    result.errors!.trips = (tripsRes.reason as Error)?.message ?? "fetch failed";
    console.warn("[gtfs-rt] trips fetch failed", tripsRes.reason);
  }

  if (vehiclesRes.status === "fulfilled") {
    try {
      const feed = decodeFeed(vehiclesRes.value);
      result.feedTimestamps.vehicles = Number(feed.header?.timestamp ?? 0) || undefined;
      result.vehicles = feed.entity
        .filter((e: any) => e.vehicle)
        .map((e: any) => {
          const v = e.vehicle;
          return {
            vehicleId: v.vehicle?.id || v.vehicle?.label || "",
            label: v.vehicle?.label || undefined,
            tripId: v.trip?.tripId || "",
            routeId: v.trip?.routeId || "",
            lat: Number(v.position?.latitude ?? 0),
            lon: Number(v.position?.longitude ?? 0),
            bearing: v.position?.bearing != null ? Number(v.position.bearing) : undefined,
            speed: v.position?.speed != null ? Number(v.position.speed) : undefined,
            timestamp: Number(v.timestamp || 0),
          } as VehiclePosition;
        })
        .filter((v: VehiclePosition) => Number.isFinite(v.lat) && Number.isFinite(v.lon) && v.lat !== 0 && v.lon !== 0);
    } catch (e) {
      result.errors!.vehicles = `decode: ${(e as Error).message}`;
      console.warn("[gtfs-rt] vehicles decode failed", e);
    }
  } else {
    result.errors!.vehicles = (vehiclesRes.reason as Error)?.message ?? "fetch failed";
    console.warn("[gtfs-rt] vehicles fetch failed", vehiclesRes.reason);
  }

  if (alertsRes.status === "fulfilled") {
    try {
      const feed = decodeFeed(alertsRes.value);
      result.feedTimestamps.alerts = Number(feed.header?.timestamp ?? 0) || undefined;
      result.alerts = feed.entity
        .filter((e: any) => e.alert)
        .map((e: any) => {
          const a = e.alert;
          const informed = (a.informedEntity || []) as any[];
          return {
            id: e.id || "",
            headerText: extractText(a.headerText),
            descriptionText: extractText(a.descriptionText),
            routeIds: Array.from(new Set(informed.map((ie: any) => ie.routeId).filter(Boolean))) as string[],
            stopIds: Array.from(new Set(informed.map((ie: any) => ie.stopId).filter(Boolean))) as string[],
            activePeriods: (a.activePeriod || []).map((p: any) => ({
              start: Number(p.start || 0),
              end: Number(p.end || 0),
            })),
            cause: causeMap[a.cause] || "",
            effect: effectMap[a.effect] || "",
          } as ServiceAlert;
        });
    } catch (e) {
      result.errors!.alerts = `decode: ${(e as Error).message}`;
      console.warn("[gtfs-rt] alerts decode failed", e);
    }
  } else {
    result.errors!.alerts = (alertsRes.reason as Error)?.message ?? "fetch failed";
    console.warn("[gtfs-rt] alerts fetch failed", alertsRes.reason);
  }

  // Use newest feed timestamp as lastUpdated when available
  const newestFeedTs = Math.max(
    result.feedTimestamps.trips ?? 0,
    result.feedTimestamps.vehicles ?? 0,
    result.feedTimestamps.alerts ?? 0,
  );
  if (newestFeedTs > 0) result.lastUpdated = new Date(newestFeedTs * 1000);

  // Strip empty errors object for cleaner consumers
  if (Object.keys(result.errors!).length === 0) delete result.errors;

  return result;
}

/** Filter alerts to those currently active (or with no activePeriod = always active). */
function isAlertActive(a: ServiceAlert, nowSec: number): boolean {
  if (!a.activePeriods || a.activePeriods.length === 0) return true;
  return a.activePeriods.some(
    (p) => (p.start === 0 || p.start <= nowSec) && (p.end === 0 || p.end >= nowSec),
  );
}

/** Average departure delay for a route (seconds). Uses stop updates with non-zero departures only. */
export function getRouteDelay(routeId: string, tripUpdates: TripUpdate[]): number | null {
  const routeTrips = tripUpdates.filter((t) => t.routeId === routeId);
  if (routeTrips.length === 0) return null;
  const delays = routeTrips
    .flatMap((t) => t.stopUpdates.map((s) => s.departureDelay))
    .filter((d) => Number.isFinite(d));
  if (delays.length === 0) return null;
  return Math.round(delays.reduce((a, b) => a + b, 0) / delays.length);
}

export function getRouteVehicles(routeId: string, vehicles: VehiclePosition[]): VehiclePosition[] {
  return vehicles.filter((v) => v.routeId === routeId);
}

export function getRouteAlerts(routeId: string, alerts: ServiceAlert[]): ServiceAlert[] {
  const now = Math.floor(Date.now() / 1000);
  return alerts.filter(
    (a) => isAlertActive(a, now) && (a.routeIds.length === 0 || a.routeIds.includes(routeId)),
  );
}

/** Find the trip update whose scheduled startTime is closest to a given HH:MM departure. */
export function findTripForDeparture(
  routeId: string,
  departureHHMM: string,
  tripUpdates: TripUpdate[],
  toleranceMin = 10,
): TripUpdate | null {
  const candidates = tripUpdates.filter((t) => t.routeId === routeId && t.startTime);
  if (candidates.length === 0) return null;
  const [h, m] = departureHHMM.split(":").map(Number);
  const target = h * 60 + m;
  let best: { t: TripUpdate; diff: number } | null = null;
  for (const t of candidates) {
    const [th, tm] = (t.startTime || "0:0").split(":").map(Number);
    const ts = th * 60 + tm;
    const diff = Math.abs(ts - target);
    if (diff <= toleranceMin && (!best || diff < best.diff)) best = { t, diff };
  }
  return best?.t ?? null;
}

/** Aggregate delay for a single trip's stop updates (median departure delay in seconds). */
export function getTripDelay(trip: TripUpdate | null): number | null {
  if (!trip || trip.stopUpdates.length === 0) return null;
  const vals = trip.stopUpdates.map((s) => s.departureDelay).filter((d) => Number.isFinite(d));
  if (vals.length === 0) return null;
  const sorted = [...vals].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Find live vehicle position matching a tripId (preferred) or routeId fallback. */
export function findVehicleForTrip(
  tripId: string | undefined,
  routeId: string,
  vehicles: VehiclePosition[],
): VehiclePosition | null {
  if (tripId) {
    const v = vehicles.find((vh) => vh.tripId === tripId);
    if (v) return v;
  }
  return vehicles.find((vh) => vh.routeId === routeId) ?? null;
}
