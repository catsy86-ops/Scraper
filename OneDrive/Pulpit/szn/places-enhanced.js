/* ===== MIEJSCA — ROZSZERZENIE ===== */
/* Wzbogaca prawdziwe dane OSM o: godziny tygodniowe, recenzje, ceny, polecane, gradienty */
'use strict';

const PLACES_EXTRA = {
  // Apteki
  1:  { price: 1, featured: false, popular: false, hoursWeek: { mon:'8-20',tue:'8-20',wed:'8-20',thu:'8-20',fri:'8-20',sat:'9-15',sun:'zamkn' }, gradient:'linear-gradient(135deg,#a29bfe,#8c7ae6)', reviews:[{name:'Halina S.',rating:4,text:'Mili farmaceuci, szybka obsługa.',date:'3 dni temu'}] },
  2:  { price: 1, featured: false, popular: true,  hoursWeek: { mon:'8-20',tue:'8-20',wed:'8-20',thu:'8-20',fri:'8-20',sat:'8-18',sun:'10-16' }, gradient:'linear-gradient(135deg,#a29bfe,#8c7ae6)', reviews:[{name:'Zofia B.',rating:5,text:'Czynna w niedzielę — super!',date:'2 dni temu'}] },
  3:  { price: 1, featured: false, popular: false, hoursWeek: { mon:'8-21',tue:'8-21',wed:'8-21',thu:'8-21',fri:'8-21',sat:'8-20',sun:'9-17' }, gradient:'linear-gradient(135deg,#a29bfe,#8c7ae6)', reviews:[{name:'Piotr K.',rating:4,text:'Duży wybór, długie godziny.',date:'5 dni temu'}] },
  4:  { price: 1, featured: false, popular: false, hoursWeek: { mon:'8-20',tue:'8-20',wed:'8-20',thu:'8-20',fri:'8-20',sat:'8-15',sun:'zamkn' }, gradient:'linear-gradient(135deg,#a29bfe,#8c7ae6)', reviews:[{name:'Jan S.',rating:4,text:'Lokalna sieć, polecam.',date:'1 tydz. temu'}] },
  // Sklepy
  5:  { price: 1, featured: false, popular: true,  hoursWeek: { mon:'6-23',tue:'6-23',wed:'6-23',thu:'6-23',fri:'6-23',sat:'6-23',sun:'6-23' }, gradient:'linear-gradient(135deg,#6bcb77,#5ab369)', reviews:[{name:'Kasia M.',rating:3,text:'Czynny do 23, ratuje życie.',date:'1 dzień temu'}] },
  // Jedzenie
  6:  { price: 1, featured: true,  popular: true,  hoursWeek: { mon:'11-23',tue:'11-23',wed:'11-23',thu:'11-23',fri:'11-23',sat:'11-23',sun:'11-23' }, gradient:'linear-gradient(135deg,#ffd93d,#f0c419)', reviews:[{name:'Bartek F.',rating:5,text:'Najlepszy kebab w okolicy!',date:'1 dzień temu'},{name:'Ola K.',rating:4,text:'Duże porcje, szybka obsługa.',date:'3 dni temu'}] },
  7:  { price: 2, featured: false, popular: true,  hoursWeek: { mon:'11-23',tue:'11-23',wed:'11-23',thu:'11-23',fri:'11-23',sat:'11-23',sun:'11-23' }, gradient:'linear-gradient(135deg,#ffd93d,#f0c419)', reviews:[{name:'Daniel W.',rating:4,text:'Klasyczna Pizza Hut, zawsze OK.',date:'2 dni temu'}] },
  8:  { price: 2, featured: false, popular: false, hoursWeek: { mon:'12-23',tue:'12-23',wed:'12-23',thu:'12-23',fri:'12-23',sat:'12-23',sun:'12-23' }, gradient:'linear-gradient(135deg,#ffd93d,#f0c419)', reviews:[{name:'Ewa T.',rating:4,text:'Dobra lokalna pizza.',date:'4 dni temu'}] },
  9:  { price: 1, featured: true,  popular: true,  hoursWeek: { mon:'7-20',tue:'7-20',wed:'7-20',thu:'7-20',fri:'7-20',sat:'7-16',sun:'zamkn' }, gradient:'linear-gradient(135deg,#ffd93d,#f0c419)', reviews:[{name:'Mama Zuzi',rating:5,text:'Świeże pieczywo rano — rewelacja!',date:'1 dzień temu'},{name:'Tomek L.',rating:5,text:'Najlepsze bułki na Niebuszewie.',date:'3 dni temu'}] },
  10: { price: 1, featured: false, popular: true,  hoursWeek: { mon:'6-18',tue:'6-18',wed:'6-18',thu:'6-18',fri:'6-18',sat:'6-18',sun:'zamkn' }, gradient:'linear-gradient(135deg,#ffd93d,#f0c419)', reviews:[{name:'Natalia C.',rating:4,text:'Tradycyjne wypieki, polecam.',date:'2 dni temu'}] },
  // Edukacja
  11: { price: 0, featured: false, popular: false, hoursWeek: { mon:'7-17',tue:'7-17',wed:'7-17',thu:'7-17',fri:'7-17',sat:'zamkn',sun:'zamkn' }, gradient:'linear-gradient(135deg,#fd79a8,#e84393)', reviews:[{name:'Rodzic ucznia',rating:4,text:'Dobra szkoła, zaangażowani nauczyciele.',date:'1 tydz. temu'}] },
  12: { price: 0, featured: false, popular: false, hoursWeek: { mon:'7-17',tue:'7-17',wed:'7-17',thu:'7-17',fri:'7-17',sat:'zamkn',sun:'zamkn' }, gradient:'linear-gradient(135deg,#fd79a8,#e84393)', reviews:[{name:'Mama Kacpra',rating:4,text:'Duża szkoła, dużo zajęć dodatkowych.',date:'5 dni temu'}] },
  13: { price: 0, featured: false, popular: false, hoursWeek: { mon:'7-17',tue:'7-17',wed:'7-17',thu:'7-17',fri:'7-17',sat:'zamkn',sun:'zamkn' }, gradient:'linear-gradient(135deg,#fd79a8,#e84393)', reviews:[{name:'Tata Zosi',rating:4,text:'Aktywna społeczność szkolna.',date:'1 tydz. temu'}] },
  14: { price: 0, featured: false, popular: true,  hoursWeek: { mon:'6.5-17',tue:'6.5-17',wed:'6.5-17',thu:'6.5-17',fri:'6.5-17',sat:'zamkn',sun:'zamkn' }, gradient:'linear-gradient(135deg,#fd79a8,#e84393)', reviews:[{name:'Mama Zuzi',rating:5,text:'Świetne przedszkole, polecam!',date:'2 dni temu'}] },
  15: { price: 0, featured: false, popular: false, hoursWeek: { mon:'6.5-17',tue:'6.5-17',wed:'6.5-17',thu:'6.5-17',fri:'6.5-17',sat:'zamkn',sun:'zamkn' }, gradient:'linear-gradient(135deg,#fd79a8,#e84393)', reviews:[] },
  16: { price: 1, featured: true,  popular: true,  hoursWeek: { mon:'7-17',tue:'7-17',wed:'7-17',thu:'7-17',fri:'7-17',sat:'zamkn',sun:'zamkn' }, gradient:'linear-gradient(135deg,#fd79a8,#e84393)', reviews:[{name:'Rodzic',rating:5,text:'Małe grupy, indywidualne podejście. Polecam!',date:'3 dni temu'}] },
  // Banki/usługi
  17: { price: 0, featured: false, popular: false, hoursWeek: { mon:'9-17',tue:'9-17',wed:'9-17',thu:'9-17',fri:'9-17',sat:'zamkn',sun:'zamkn' }, gradient:'linear-gradient(135deg,#a29bfe,#8c7ae6)', reviews:[{name:'Krzysztof D.',rating:3,text:'Standardowy oddział bankowy.',date:'1 tydz. temu'}] },
  18: { price: 0, featured: false, popular: false, hoursWeek: { mon:'9-16',tue:'9-16',wed:'10-17',thu:'9-16',fri:'9-16',sat:'zamkn',sun:'zamkn' }, gradient:'linear-gradient(135deg,#a29bfe,#8c7ae6)', reviews:[{name:'Stanisław J.',rating:4,text:'Miła obsługa, krótkie kolejki.',date:'4 dni temu'}] },
  19: { price: 0, featured: false, popular: false, hoursWeek: { mon:'9-17',tue:'9-17',wed:'9-17',thu:'9-17',fri:'9-17',sat:'zamkn',sun:'zamkn' }, gradient:'linear-gradient(135deg,#a29bfe,#8c7ae6)', reviews:[] },
  20: { price: 1, featured: false, popular: false, hoursWeek: { mon:'9-20',tue:'8-19',wed:'8-19',thu:'8-19',fri:'8-19',sat:'zamkn',sun:'zamkn' }, gradient:'linear-gradient(135deg,#a29bfe,#8c7ae6)', reviews:[{name:'Zofia B.',rating:3,text:'Bywają kolejki, ale obsługa OK.',date:'3 dni temu'}] },
  // Parki
  21: { price: 0, featured: true,  popular: true,  hoursWeek: { mon:'0-24',tue:'0-24',wed:'0-24',thu:'0-24',fri:'0-24',sat:'0-24',sun:'0-24' }, gradient:'linear-gradient(135deg,#4ecdc4,#44a39b)', reviews:[{name:'Rodzina Nowak',rating:5,text:'Piękny park, idealne miejsce na spacer.',date:'2 dni temu'},{name:'Piotr Z.',rating:5,text:'Czysto i spokojnie.',date:'5 dni temu'}] },
  22: { price: 0, featured: false, popular: true,  hoursWeek: { mon:'0-24',tue:'0-24',wed:'0-24',thu:'0-24',fri:'0-24',sat:'0-24',sun:'0-24' }, gradient:'linear-gradient(135deg,#4ecdc4,#44a39b)', reviews:[{name:'Ania W.',rating:4,text:'Spokojny park, dużo zieleni.',date:'4 dni temu'}] },
  // Kościoły
  23: { price: 0, featured: false, popular: true,  hoursWeek: { mon:'6-20',tue:'6-20',wed:'6-20',thu:'6-20',fri:'6-20',sat:'6-20',sun:'6-21' }, gradient:'linear-gradient(135deg,#a29bfe,#8c7ae6)', reviews:[{name:'Halina S.',rating:5,text:'Piękny kościół, aktywna parafia.',date:'1 tydz. temu'}] },
  24: { price: 0, featured: false, popular: false, hoursWeek: { mon:'6-20',tue:'6-20',wed:'6-20',thu:'6-20',fri:'6-20',sat:'6-20',sun:'6-21' }, gradient:'linear-gradient(135deg,#a29bfe,#8c7ae6)', reviews:[{name:'Jan S.',rating:5,text:'Zabytkowy kościół z historią.',date:'2 tydz. temu'}] },
  // Sport
  25: { price: 0, featured: false, popular: true,  hoursWeek: { mon:'0-24',tue:'0-24',wed:'0-24',thu:'0-24',fri:'0-24',sat:'0-24',sun:'0-24' }, gradient:'linear-gradient(135deg,#ff6b6b,#ee5a52)', reviews:[{name:'Marek K.',rating:4,text:'Dobre boisko, gramy tu regularnie.',date:'3 dni temu'}] },
  26: { price: 0, featured: false, popular: true,  hoursWeek: { mon:'0-24',tue:'0-24',wed:'0-24',thu:'0-24',fri:'0-24',sat:'0-24',sun:'0-24' }, gradient:'linear-gradient(135deg,#ff6b6b,#ee5a52)', reviews:[{name:'Bartek F.',rating:5,text:'Codziennie tu ćwiczę. Za darmo!',date:'1 dzień temu'}] },
  // Szkoła społeczna
  27: { price: 1, featured: false, popular: false, hoursWeek: { mon:'7-17',tue:'7-17',wed:'7-17',thu:'7-17',fri:'7-17',sat:'zamkn',sun:'zamkn' }, gradient:'linear-gradient(135deg,#fd79a8,#e84393)', reviews:[{name:'Rodzic',rating:5,text:'Świetna szkoła, polecam.',date:'1 tydz. temu'}] }
};

function enrichPlaces() {
  if (typeof APP_DATA === 'undefined' || !APP_DATA.places) return;
  APP_DATA.places.forEach(p => {
    const extra = PLACES_EXTRA[p.id];
    if (extra) Object.assign(p, extra);
    try {
      const stored = JSON.parse(localStorage.getItem('lucznicza_reviews_' + p.id) || '[]');
      if (stored.length) p.reviews = stored.concat(p.reviews || []);
    } catch {}
    if (p.reviews && p.reviews.length) {
      const avg = p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length;
      p.reviewCount = p.reviews.length;
      p.reviewAvg = Math.round(avg * 10) / 10;
    } else {
      p.reviewCount = 0;
    }
  });
}
enrichPlaces();

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  let stars = '';
  for (let i = 0; i < 5; i++) {
    if (i < full) stars += '★';
    else if (i === full && half) stars += '⯨';
    else stars += '☆';
  }
  return stars;
}

function getOpenStatus(place) {
  const hw = place.hoursWeek;
  if (!hw) return null;
  const now = new Date();
  const dayMap = ['sun','mon','tue','wed','thu','fri','sat'];
  const today = dayMap[now.getDay()];
  const range = hw[today];
  if (!range || range === 'zamkn') return { open: false, label: 'Zamknięte', sub: 'Dziś nieczynne' };
  if (range === '0-24') return { open: true, label: 'Otwarte 24h', sub: 'Czynne całą dobę' };
  if (range === 'dyżur') return { open: true, label: 'Dyżur', sub: 'Dyżur weekendowy' };
  const [openH, closeH] = range.split('-').map(parseFloat);
  const curH = now.getHours() + now.getMinutes() / 60;
  if (curH >= openH && curH < closeH) {
    const closesIn = closeH - curH;
    const sub = closesIn <= 1 ? `Zamknięcie za ${Math.round(closesIn * 60)} min` : `Otwarte do ${formatHour(closeH)}`;
    return { open: true, label: 'Otwarte', sub };
  } else {
    const sub = curH < openH ? `Otwarcie o ${formatHour(openH)}` : `Otwarcie jutro o ${formatHour(openH)}`;
    return { open: false, label: 'Zamknięte', sub };
  }
}

function formatHour(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return mm ? `${hh}:${String(mm).padStart(2, '0')}` : `${hh}:00`;
}

function renderPriceLevel(price) {
  if (price === 0) return '<span class="price-free">Bezpłatne</span>';
  if (!price) return '';
  return '<span class="price-level">' + '💰'.repeat(price) + '</span>';
}

const FAVORITES_KEY = 'lucznicza_favorites';
function getFavorites() { try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); } catch { return []; } }
function isFavorite(id) { return getFavorites().includes(id); }
function toggleFavorite(id) {
  let favs = getFavorites();
  favs = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  return favs.includes(id);
}

let USER_LOCATION = null;
function setUserLocation(lat, lng) { USER_LOCATION = { lat, lng }; }
function distanceToPlace(place) {
  if (!USER_LOCATION) return null;
  const R = 6371;
  const dLat = (place.coords[1] - USER_LOCATION.lat) * Math.PI / 180;
  const dLon = (place.coords[0] - USER_LOCATION.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(USER_LOCATION.lat * Math.PI/180) * Math.cos(place.coords[1] * Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function formatDistance(km) {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

window.placesEnhanced = {
  renderStars, getOpenStatus, renderPriceLevel,
  getFavorites, isFavorite, toggleFavorite,
  setUserLocation, distanceToPlace, formatDistance,
  PLACES_EXTRA
};
