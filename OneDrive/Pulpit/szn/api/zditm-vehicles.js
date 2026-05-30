/**
 * Vercel Serverless — ZDiTM Vehicles proxy
 * Prawdziwe pozycje GPS autobusów i tramwajów w Szczecinie
 * Endpoint: /api/zditm-vehicles
 * Filtruje pojazdy do okolic Niebuszewo (opcjonalnie ?all=1 dla wszystkich)
 */

// Niebuszewo bounding box (z marginesem)
const BBOX = { minLat: 53.435, maxLat: 53.475, minLon: 14.530, maxLon: 14.585 };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=10, s-maxage=10');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const r = await fetch('https://www.zditm.szczecin.pl/api/v1/vehicles', {
      headers: {
        'User-Agent': 'Mozilla/5.0 NiebuszewoGuide/1.0',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pl-PL,pl;q=0.9',
        'Referer': 'https://lucznicza.vercel.app/'
      }
    });

    if (!r.ok) throw new Error(`ZDiTM HTTP ${r.status}`);
    const json = await r.json();
    const all = json.data || json || [];

    const showAll = req.query.all === '1';

    const vehicles = all
      .filter(v => v.latitude && v.longitude)
      .filter(v => showAll || (
        v.latitude  >= BBOX.minLat && v.latitude  <= BBOX.maxLat &&
        v.longitude >= BBOX.minLon && v.longitude <= BBOX.maxLon
      ))
      .map(v => ({
        id: v.vehicle_id,
        line: String(v.line_number || ''),
        type: v.vehicle_type || 'bus',          // bus | tram
        lineType: v.line_type || 'day',          // day | night
        direction: v.direction || '',
        prevStop: v.previous_stop || '',
        nextStop: v.next_stop || '',
        lat: v.latitude,
        lon: v.longitude,
        bearing: v.bearing,                       // może być null
        velocity: v.velocity || 0,                // km/h
        punctuality: v.punctuality || 0,          // min (- = wcześniej, + = później)
        model: v.vehicle_model || '',
        lowFloor: !!v.vehicle_low_floor,
        operator: v.vehicle_operator || '',
        updatedAt: v.updated_at
      }));

    return res.status(200).json({
      source: 'zditm-live',
      timestamp: new Date().toISOString(),
      count: vehicles.length,
      totalCity: all.length,
      vehicles
    });

  } catch (err) {
    console.error('ZDiTM vehicles error:', err.message);
    return res.status(200).json({
      source: 'error',
      error: err.message,
      count: 0,
      vehicles: []
    });
  }
}
