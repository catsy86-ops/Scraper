/**
 * Route planner engine — finds direct and single-transfer connections
 * between two stops using static GTFS timetable data, enhanced with
 * real-time GTFS-RT delays.
 *
 * Inspired by JakDojade's approach: show multiple journey options
 * including transfers, with accurate travel times and walking segments.
 */
import type { GtfsRoute, GtfsStop } from "@/data/gtfs";
import type { GtfsRtData, TripUpdate } from "@/data/gtfs-rt";
import {
  findTripForDeparture,
  getTripDelay,
  findVehicleForTrip,
  getRouteAlerts,
} from "@/data/gtfs-rt";

// --- Types ---

export interface JourneyLeg {
  type: "transit" | "walk";
  // Transit fields
  route?: GtfsRoute;
  fromStop: string;
  toStop: string;
  departureTime: string; // HH:MM
  arrivalTime: string;   // HH:MM
  durationMinutes: number;
  stopsCount: number;
  intermediateStops?: string[];
  // Real-time
  delaySeconds?: number | null;
  realDeparture?: string | null;
  realArrival?: string | null;
  vehicleId?: string | null;
  vehicleLabel?: string | null;
  isLiveTrip?: boolean;
  // Walk fields
  walkDistanceM?: number;
}

export interface JourneyOption {
  id: string;
  legs: JourneyLeg[];
  totalDurationMinutes: number;
  departureTime: string;
  arrivalTime: string;
  realDeparture?: string | null;
  realArrival?: string | null;
  transferCount: number;
  alerts: { routeId: string; text: string }[];
}

export interface PlannerResult {
  journeys: JourneyOption[];
  fromStop: string;
  toStop: string;
  requestedTime: string;
  timestamp: number;
}

// --- Helpers ---

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(((mins % 1440) + 1440) % 1440 / 60);
  const m = ((mins % 60) + 60) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addDelayToTime(hhmm: string, delaySec: number | null | undefined): string {
  if (!delaySec) return hhmm;
  const mins = timeToMinutes(hhmm) + Math.round(delaySec / 60);
  return minutesToTime(mins);
}

/** Normalize stop name for matching (strips trailing platform numbers) */
function normalizeStop(s: string): string {
  return s.toLowerCase().replace(/\s+\d+$/, "").trim();
}

function stopsMatch(a: string, b: string): boolean {
  return normalizeStop(a) === normalizeStop(b);
}

/** Find stop index in route matching a given stop name */
function findStopIndex(route: GtfsRoute, stopName: string): number {
  return route.stops.findIndex((s) => stopsMatch(s.n, stopName));
}

// --- Direct journey finder ---

interface DirectLeg {
  route: GtfsRoute;
  fromIdx: number;
  toIdx: number;
  dep: string;
  arr: string;
  minutes: number;
}

function findDirectLegs(
  route: GtfsRoute,
  fromStop: string,
  toStop: string,
  afterMinutes: number,
  maxLegs = 4,
): DirectLeg[] {
  const fromIdx = findStopIndex(route, fromStop);
  const toIdx = findStopIndex(route, toStop);
  if (fromIdx < 0 || toIdx < 0 || fromIdx >= toIdx) return [];

  const fromStopData = route.stops[fromIdx];
  const toStopData = route.stops[toIdx];
  const legs: DirectLeg[] = [];

  for (const dep of fromStopData.d) {
    const depM = timeToMinutes(dep);
    if (depM < afterMinutes) continue;

    // Find the matching arrival at destination
    const arr = toStopData.d.find((a) => {
      const arrM = timeToMinutes(a);
      return arrM > depM && arrM - depM <= 180; // max 3h journey
    });

    if (arr) {
      legs.push({
        route,
        fromIdx,
        toIdx,
        dep,
        arr,
        minutes: timeToMinutes(arr) - depM,
      });
    }
    if (legs.length >= maxLegs) break;
  }

  return legs;
}

// --- Transfer finder ---

interface TransferPoint {
  stopName: string;
  route1: GtfsRoute;
  route1FromIdx: number;
  route1ToIdx: number; // index of transfer stop in route1
  route2: GtfsRoute;
  route2FromIdx: number; // index of transfer stop in route2
  route2ToIdx: number;
}

/** Find possible transfer points between routes */
function findTransferPoints(
  routes: GtfsRoute[],
  fromStop: string,
  toStop: string,
): TransferPoint[] {
  const points: TransferPoint[] = [];

  // Find routes serving fromStop and routes serving toStop
  const routesFromStart: { route: GtfsRoute; fromIdx: number }[] = [];
  const routesToEnd: { route: GtfsRoute; toIdx: number }[] = [];

  for (const route of routes) {
    const fromIdx = findStopIndex(route, fromStop);
    if (fromIdx >= 0) routesFromStart.push({ route, fromIdx });
    const toIdx = findStopIndex(route, toStop);
    if (toIdx >= 0) routesToEnd.push({ route, toIdx });
  }

  // For each pair, find common intermediate stops
  for (const { route: r1, fromIdx } of routesFromStart) {
    for (const { route: r2, toIdx } of routesToEnd) {
      if (r1.id === r2.id) continue; // skip same route

      // Check stops after fromIdx in r1 against stops before toIdx in r2
      for (let i = fromIdx + 1; i < r1.stops.length; i++) {
        const transferStop = r1.stops[i].n;
        const r2Idx = r2.stops.findIndex(
          (s, idx) => idx < toIdx && stopsMatch(s.n, transferStop),
        );
        if (r2Idx >= 0) {
          points.push({
            stopName: transferStop,
            route1: r1,
            route1FromIdx: fromIdx,
            route1ToIdx: i,
            route2: r2,
            route2FromIdx: r2Idx,
            route2ToIdx: toIdx,
          });
        }
      }
    }
  }

  return points;
}

/** Build transfer journeys */
function findTransferJourneys(
  routes: GtfsRoute[],
  fromStop: string,
  toStop: string,
  afterMinutes: number,
  maxResults = 6,
): { legs: [DirectLeg, DirectLeg]; transferStop: string }[] {
  const transferPoints = findTransferPoints(routes, fromStop, toStop);
  const results: { legs: [DirectLeg, DirectLeg]; transferStop: string; totalMin: number }[] = [];

  const MIN_TRANSFER_TIME = 2; // minimum 2 minutes to transfer
  const MAX_TRANSFER_WAIT = 30; // max 30 min wait at transfer

  for (const tp of transferPoints) {
    // Find first leg departures
    const firstLegs = findDirectLegs(tp.route1, fromStop, tp.stopName, afterMinutes, 3);

    for (const leg1 of firstLegs) {
      const arrivalAtTransfer = timeToMinutes(leg1.arr);
      const minDep2 = arrivalAtTransfer + MIN_TRANSFER_TIME;

      // Find second leg departures after arriving at transfer + buffer
      const secondLegs = findDirectLegs(tp.route2, tp.stopName, toStop, minDep2, 2);

      for (const leg2 of secondLegs) {
        const dep2Min = timeToMinutes(leg2.dep);
        const waitTime = dep2Min - arrivalAtTransfer;

        if (waitTime > MAX_TRANSFER_WAIT) continue;

        const totalMin = timeToMinutes(leg2.arr) - timeToMinutes(leg1.dep);
        results.push({
          legs: [leg1, leg2],
          transferStop: tp.stopName,
          totalMin,
        });
      }
    }
  }

  // Sort by total journey time, then deduplicate
  results.sort((a, b) => a.totalMin - b.totalMin);

  // Deduplicate — keep unique route1+route2+dep combinations
  const seen = new Set<string>();
  return results
    .filter((r) => {
      const key = `${r.legs[0].route.id}-${r.legs[1].route.id}-${r.legs[0].dep}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, maxResults);
}

// --- Main planner ---

export function planJourneys(
  routes: GtfsRoute[],
  fromStop: string,
  toStop: string,
  departureTime: string, // HH:MM or "now"
  rtData: GtfsRtData | null,
): PlannerResult {
  const now = new Date();
  const currentTimeStr =
    departureTime === "now"
      ? `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      : departureTime;
  const afterMinutes = timeToMinutes(currentTimeStr);

  const journeys: JourneyOption[] = [];
  let idCounter = 0;

  // 1. Find direct connections
  for (const route of routes) {
    const legs = findDirectLegs(route, fromStop, toStop, afterMinutes, 2);

    for (const leg of legs) {
      // RT enrichment
      const matchedTrip = rtData
        ? findTripForDeparture(route.id, leg.dep, rtData.tripUpdates)
        : null;
      const tripDelay = getTripDelay(matchedTrip);
      const vehicle = rtData
        ? findVehicleForTrip(matchedTrip?.tripId, route.id, rtData.vehicles)
        : null;

      const intermediateStops = route.stops
        .slice(leg.fromIdx + 1, leg.toIdx)
        .map((s) => s.n);

      const transitLeg: JourneyLeg = {
        type: "transit",
        route,
        fromStop: route.stops[leg.fromIdx].n,
        toStop: route.stops[leg.toIdx].n,
        departureTime: leg.dep,
        arrivalTime: leg.arr,
        durationMinutes: leg.minutes,
        stopsCount: leg.toIdx - leg.fromIdx,
        intermediateStops,
        delaySeconds: tripDelay,
        realDeparture: tripDelay ? addDelayToTime(leg.dep, tripDelay) : null,
        realArrival: tripDelay ? addDelayToTime(leg.arr, tripDelay) : null,
        vehicleId: vehicle?.vehicleId ?? null,
        vehicleLabel: vehicle?.label ?? null,
        isLiveTrip: !!matchedTrip,
      };

      const alerts = rtData
        ? getRouteAlerts(route.id, rtData.alerts).map((a) => ({
            routeId: route.id,
            text: a.headerText,
          }))
        : [];

      journeys.push({
        id: `j-${idCounter++}`,
        legs: [transitLeg],
        totalDurationMinutes: leg.minutes,
        departureTime: leg.dep,
        arrivalTime: leg.arr,
        realDeparture: transitLeg.realDeparture,
        realArrival: transitLeg.realArrival,
        transferCount: 0,
        alerts,
      });
    }
  }

  // 2. Find transfer connections (only if fewer than 4 direct found)
  if (journeys.length < 4) {
    const transfers = findTransferJourneys(routes, fromStop, toStop, afterMinutes, 4);

    for (const transfer of transfers) {
      const [leg1, leg2] = transfer.legs;

      const enrichLeg = (dLeg: DirectLeg): JourneyLeg => {
        const matchedTrip = rtData
          ? findTripForDeparture(dLeg.route.id, dLeg.dep, rtData.tripUpdates)
          : null;
        const tripDelay = getTripDelay(matchedTrip);
        const vehicle = rtData
          ? findVehicleForTrip(matchedTrip?.tripId, dLeg.route.id, rtData.vehicles)
          : null;

        return {
          type: "transit",
          route: dLeg.route,
          fromStop: dLeg.route.stops[dLeg.fromIdx].n,
          toStop: dLeg.route.stops[dLeg.toIdx].n,
          departureTime: dLeg.dep,
          arrivalTime: dLeg.arr,
          durationMinutes: dLeg.minutes,
          stopsCount: dLeg.toIdx - dLeg.fromIdx,
          intermediateStops: dLeg.route.stops
            .slice(dLeg.fromIdx + 1, dLeg.toIdx)
            .map((s) => s.n),
          delaySeconds: tripDelay,
          realDeparture: tripDelay ? addDelayToTime(dLeg.dep, tripDelay) : null,
          realArrival: tripDelay ? addDelayToTime(dLeg.arr, tripDelay) : null,
          vehicleId: vehicle?.vehicleId ?? null,
          vehicleLabel: vehicle?.label ?? null,
          isLiveTrip: !!matchedTrip,
        };
      };

      const transitLeg1 = enrichLeg(leg1);
      const transitLeg2 = enrichLeg(leg2);

      // Walk leg between transfers (waiting time)
      const waitMinutes =
        timeToMinutes(leg2.dep) - timeToMinutes(leg1.arr);
      const walkLeg: JourneyLeg = {
        type: "walk",
        fromStop: transfer.transferStop,
        toStop: transfer.transferStop,
        departureTime: leg1.arr,
        arrivalTime: leg2.dep,
        durationMinutes: waitMinutes,
        stopsCount: 0,
        walkDistanceM: 0, // same stop transfer
      };

      const totalMin = timeToMinutes(leg2.arr) - timeToMinutes(leg1.dep);

      const alerts = rtData
        ? [
            ...getRouteAlerts(leg1.route.id, rtData.alerts),
            ...getRouteAlerts(leg2.route.id, rtData.alerts),
          ].map((a) => ({ routeId: a.routeIds[0] || "", text: a.headerText }))
        : [];

      journeys.push({
        id: `j-${idCounter++}`,
        legs: [transitLeg1, walkLeg, transitLeg2],
        totalDurationMinutes: totalMin,
        departureTime: leg1.dep,
        arrivalTime: leg2.arr,
        realDeparture: transitLeg1.realDeparture,
        realArrival: transitLeg2.realArrival,
        transferCount: 1,
        alerts,
      });
    }
  }

  // Sort: earliest effective departure first, then shortest total time
  journeys.sort((a, b) => {
    const aDepMin = timeToMinutes(a.realDeparture || a.departureTime);
    const bDepMin = timeToMinutes(b.realDeparture || b.departureTime);
    if (aDepMin !== bDepMin) return aDepMin - bDepMin;
    return a.totalDurationMinutes - b.totalDurationMinutes;
  });

  return {
    journeys: journeys.slice(0, 8),
    fromStop,
    toStop,
    requestedTime: currentTimeStr,
    timestamp: Date.now(),
  };
}
