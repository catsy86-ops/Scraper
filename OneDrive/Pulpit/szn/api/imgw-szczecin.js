/**
 * Vercel Serverless — IMGW Szczecin proxy
 * Pobiera dane synoptyczne + hydrologiczne dla Szczecina
 * Bezpłatne API IMGW, bez klucza
 */
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const [synopRes, hydroRes] = await Promise.all([
      fetch('https://danepubliczne.imgw.pl/api/data/synop/station/szczecin', {
        headers: { 'User-Agent': 'SzczecinGuide/1.0' }
      }),
      fetch('https://danepubliczne.imgw.pl/api/data/hydro/station/szczecin', {
        headers: { 'User-Agent': 'SzczecinGuide/1.0' }
      })
    ]);

    const synop = synopRes.ok ? await synopRes.json() : null;

    // Hydro returns all stations — filter for Odra Szczecin (id 153140050)
    let hydro = null;
    if (hydroRes.ok) {
      const hydroAll = await hydroRes.json();
      const arr = Array.isArray(hydroAll) ? hydroAll : [];
      hydro = arr.find(s => s.id_stacji === '153140050') || arr.find(s => s.stacja === 'Szczecin') || null;
    }

    return res.status(200).json({
      source: 'imgw',
      timestamp: new Date().toISOString(),
      synop: synop ? {
        temp: parseFloat(synop.temperatura),
        windSpeed: parseFloat(synop.predkosc_wiatru),
        windDir: parseInt(synop.kierunek_wiatru),
        humidity: parseFloat(synop.wilgotnosc_wzgledna),
        pressure: parseFloat(synop.cisnienie),
        precipitation: parseFloat(synop.suma_opadu) || 0,
        measuredAt: `${synop.data_pomiaru} ${synop.godzina_pomiaru}:00`
      } : null,
      hydro: hydro ? {
        river: hydro.rzeka,
        station: hydro.stacja,
        waterLevel: parseInt(hydro.stan_wody),
        waterTemp: hydro.temperatura_wody ? parseFloat(hydro.temperatura_wody) : null,
        measuredAt: hydro.stan_wody_data_pomiaru
      } : null
    });

  } catch (err) {
    console.error('IMGW proxy error:', err);
    return res.status(200).json({ source: 'error', error: err.message, synop: null, hydro: null });
  }
}
