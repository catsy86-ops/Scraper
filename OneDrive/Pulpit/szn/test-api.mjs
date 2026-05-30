// Probe ZDiTM API with various header combos
const base = 'https://api.zditm.szczecin.pl/v1/stops';
const combos = [
  { name: 'identity encoding', headers: { 'Accept-Encoding': 'identity', 'Accept': 'application/json' } },
  { name: 'gzip', headers: { 'Accept-Encoding': 'gzip, deflate, br', 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' } },
  { name: 'with referer', headers: { 'Accept': 'application/json', 'Referer': 'https://www.zditm.szczecin.pl/', 'User-Agent': 'Mozilla/5.0' } },
  { name: 'x-requested-with', headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'User-Agent': 'Mozilla/5.0' } },
];

for (const c of combos) {
  try {
    const res = await fetch(base, { headers: c.headers });
    const text = await res.text();
    console.log(`[${c.name}] status=${res.status} len=${text.length} cors=${res.headers.get('access-control-allow-origin')}`);
    if (text.length > 10) console.log('  DATA:', text.substring(0, 150));
  } catch (e) {
    console.log(`[${c.name}] ERROR: ${e.message}`);
  }
}
