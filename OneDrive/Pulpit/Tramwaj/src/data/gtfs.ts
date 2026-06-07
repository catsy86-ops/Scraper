export interface GtfsStop {
  n: string;   // name
  la: number;  // lat
  lo: number;  // lon
  d: string[]; // departures HH:MM
}

export interface GtfsRoute {
  id: string;
  num: string;
  name: string;
  type: "tram" | "bus";
  color: string;
  url: string;
  from: string;
  to: string;
  stops: GtfsStop[];
}

export interface GtfsData {
  routes: GtfsRoute[];
  allStops: string[];
  generatedAt?: string;
}

let cachedData: GtfsData | null = null;

export async function loadGtfsData(): Promise<GtfsData> {
  if (cachedData) return cachedData;
  const res = await fetch("/gtfs-data.json");
  cachedData = await res.json();
  return cachedData!;
}
