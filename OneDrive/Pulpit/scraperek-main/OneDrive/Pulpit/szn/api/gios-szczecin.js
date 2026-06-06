/**
 * Vercel Serverless — GIOŚ Szczecin AQI proxy
 * Stacja 986: Szczecin, ul. Andrzejewskiego
 * Encoding-safe: uses JSON.stringify search instead of key matching
 */

const STATION_ID = 986;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=900, s-maxage=900');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const aqiRes = await fetch(
      `https://api.gios.gov.pl/pjp-api/v1/rest/aqindex/getIndex/${STATION_ID}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 SzczecinGuide/1.0',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pl-PL,pl;q=0.9',
          'Referer': 'https://szn-theta.vercel.app/'
        }
      }
    );

    if (!aqiRes.ok) throw new Error(`GIOS HTTP ${aqiRes.status}`);

    // Get raw text first to handle encoding
    const rawText = await aqiRes.text();
    const aqiData = JSON.parse(rawText);

    // Find AqIndex object — try multiple key variants
    const idx = aqiData['AqIndex'] || aqiData['aqindex'] || {};

    // Extract values by iterating all keys and matching by content
    let catName = 'Brak danych';
    let indexValue = null;
    let calcAt = null;
    const pollutantData = {};

    const keys = Object.keys(idx);
    keys.forEach(function(key) {
      const val = idx[key];
      const k = key.toLowerCase();
      // Overall category (not per-pollutant)
      if (k.indexOf('nazwa kategorii indeksu') !== -1 && k.indexOf('wska') === -1 && k.indexOf('so2') === -1 && k.indexOf('no2') === -1 && k.indexOf('pm') === -1 && k.indexOf('o3') === -1) {
        catName = String(val || 'Brak danych');
      }
      // Overall index value
      if (k.indexOf('warto') !== -1 && k.indexOf('indeksu') !== -1 && k.indexOf('wska') === -1 && k.indexOf('so2') === -1 && k.indexOf('no2') === -1 && k.indexOf('pm') === -1 && k.indexOf('o3') === -1) {
        if (val !== null && val !== undefined) indexValue = val;
      }
      // Calculation date
      if (k.indexOf('data wykonania') !== -1 && k.indexOf('wska') === -1) {
        calcAt = String(val || '');
      }
      // Per-pollutant
      ['SO2', 'NO2', 'PM10', 'PM2.5', 'O3'].forEach(function(poll) {
        if (k.indexOf('warto') !== -1 && k.indexOf('indeksu') !== -1 && k.indexOf(poll.toLowerCase()) !== -1) {
          if (val !== null && val !== undefined) pollutantData[poll] = val;
        }
      });
    });

    const categoryMap = {
      'Bardzo dobry': { level: 1, color: '#00e400' },
      'Dobry':        { level: 2, color: '#92d050' },
      'Umiarkowany':  { level: 3, color: '#ffff00' },
      'Dostateczny':  { level: 4, color: '#ff7e00' },
      'Zły':          { level: 5, color: '#ff0000' },
      'Bardzo zły':   { level: 6, color: '#8f3f97' }
    };
    const catInfo = categoryMap[catName] || { level: 0, color: '#aaa' };

    const adviceList = [
      '',
      'Idealne warunki do aktywności na zewnątrz.',
      'Dobra jakość powietrza. Można wychodzić na zewnątrz.',
      'Osoby wrażliwe powinny ograniczyć aktywność.',
      'Ogranicz aktywność na zewnątrz.',
      'Unikaj wychodzenia na zewnątrz.',
      'Pozostań w domu. Zamknij okna.'
    ];

    return res.status(200).json({
      source: 'gios',
      stationId: STATION_ID,
      stationName: 'Szczecin, ul. Andrzejewskiego',
      timestamp: new Date().toISOString(),
      calculatedAt: calcAt,
      indexValue: typeof indexValue === 'number' ? indexValue : null,
      category: catName,
      categoryLevel: catInfo.level,
      categoryColor: catInfo.color,
      pollutantIndices: pollutantData,
      advice: adviceList[catInfo.level] || ''
    });

  } catch (err) {
    console.error('GIOS error:', err.message);
    return res.status(200).json({
      source: 'error',
      error: err.message,
      category: 'Brak danych',
      categoryLevel: 0,
      categoryColor: '#aaa',
      advice: ''
    });
  }
}
