/**
 * Vercel Serverless — OSM Buildings Proxy
 * Fetches building footprints from Overpass API for Niebuszewo area.
 * Caches aggressively (buildings don't change often).
 *
 * Endpoint: /api/buildings?lat=53.454&lon=14.548&radius=300
 */

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400'); // 24h cache
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const lat = parseFloat(req.query.lat) || 53.4540;
    const lon = parseFloat(req.query.lon) || 14.5477;
    const radius = Math.min(parseInt(req.query.radius) || 400, 800); // max 800m

    // Calculate bounding box from center + radius
    const latDelta = radius / 111320;
    const lonDelta = radius / (111320 * Math.cos(lat * Math.PI / 180));
    const south = lat - latDelta;
    const north = lat + latDelta;
    const west = lon - lonDelta;
    const east = lon + lonDelta;

    // Overpass query: get buildings with geometry, levels, height, name
    const query = `[out:json][timeout:30];(way["building"](${south},${west},${north},${east});relation["building"](${south},${west},${north},${east}););out body geom;`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SzczecinGuide/1.0 (+https://szn-theta.vercel.app)'
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);

    const data = await response.json();
    const elements = data.elements || [];

    // Process buildings — extract useful data
    const buildings = elements.map(el => {
      const coords = el.geometry
        ? el.geometry.map(g => [g.lat, g.lon])
        : (el.members || []).filter(m => m.type === 'way' && m.geometry).flatMap(m => m.geometry.map(g => [g.lat, g.lon]));

      if (coords.length < 3) return null;

      const tags = el.tags || {};
      const levels = parseInt(tags['building:levels']) || guessLevels(tags.building);
      const height = parseFloat(tags.height) || levels * 3;
      const name = tags.name || tags['addr:street'] || '';
      const houseNumber = tags['addr:housenumber'] || '';
      const street = tags['addr:street'] || '';
      const buildingType = tags.building || 'yes';
      const roofShape = tags['roof:shape'] || 'flat';
      const roofColor = tags['roof:colour'] || tags['roof:color'] || '';
      const color = tags['building:colour'] || tags['building:color'] || '';

      return {
        id: el.id,
        coords,
        levels,
        height,
        name,
        address: houseNumber ? `${street} ${houseNumber}`.trim() : street,
        type: buildingType,
        roofShape,
        roofColor,
        color
      };
    }).filter(Boolean);

    return res.status(200).json({
      source: 'osm-overpass',
      timestamp: new Date().toISOString(),
      center: { lat, lon },
      radius,
      count: buildings.length,
      elements: buildings
    });

  } catch (err) {
    console.error('Buildings proxy error:', err.message);
    return res.status(200).json({
      source: 'error',
      error: err.message,
      elements: []
    });
  }
}

function guessLevels(buildingType) {
  const map = {
    'apartments': 5,
    'residential': 4,
    'house': 2,
    'detached': 2,
    'commercial': 3,
    'retail': 2,
    'industrial': 2,
    'garage': 1,
    'garages': 1,
    'shed': 1,
    'school': 3,
    'church': 4,
    'hospital': 4,
    'office': 4,
    'yes': 3
  };
  return map[buildingType] || 3;
}
