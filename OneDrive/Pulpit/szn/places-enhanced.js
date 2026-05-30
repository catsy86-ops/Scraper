/* ===== MIEJSCA — ROZSZERZENIE (DUŻY PROJEKT) ===== */
/* Wzbogaca dane miejsc o: szczegółowe godziny, recenzje, ceny,
   polecane, zdjęcia (gradienty), oraz dostarcza całą logikę UI:
   gwiazdki, status otwarte/zamknięte, odległość, sortowanie, ulubione. */
'use strict';

// ===== DODATKOWE DANE DLA KAŻDEGO MIEJSCA =====
// Klucz = id miejsca z data.js
const PLACES_EXTRA = {
  1: { // Boisko
    price: 0, featured: false, popular: true,
    hoursWeek: { mon: '0-24', tue: '0-24', wed: '0-24', thu: '0-24', fri: '0-24', sat: '0-24', sun: '0-24' },
    gradient: 'linear-gradient(135deg,#ff6b6b,#ee5a52)',
    reviews: [
      { name: 'Marek K.', rating: 5, text: 'Super boisko, gramy tu co weekend!', date: '3 dni temu' },
      { name: 'Ania W.', rating: 4, text: 'Oświetlone wieczorem, duży plus.', date: '1 tydz. temu' }
    ]
  },
  2: { // Skwer
    price: 0, featured: true, popular: true,
    hoursWeek: { mon: '0-24', tue: '0-24', wed: '0-24', thu: '0-24', fri: '0-24', sat: '0-24', sun: '0-24' },
    gradient: 'linear-gradient(135deg,#4ecdc4,#44a39b)',
    reviews: [
      { name: 'Rodzina Nowak', rating: 5, text: 'Idealne miejsce na spacer z dziećmi.', date: '2 dni temu' },
      { name: 'Piotr Z.', rating: 4, text: 'Czysto i spokojnie. Brakuje więcej ławek.', date: '5 dni temu' }
    ]
  },
  3: { // Sklep
    price: 1, featured: false, popular: false,
    hoursWeek: { mon: '6-22', tue: '6-22', wed: '6-22', thu: '6-22', fri: '6-22', sat: '7-22', sun: '8-20' },
    gradient: 'linear-gradient(135deg,#6bcb77,#5ab369)',
    reviews: [
      { name: 'Kasia M.', rating: 4, text: 'Świeże pieczywo rano, polecam!', date: '1 dzień temu' }
    ]
  },
  4: { // Bar mleczny
    price: 1, featured: true, popular: true,
    hoursWeek: { mon: '8-18', tue: '8-18', wed: '8-18', thu: '8-18', fri: '8-18', sat: 'zamkn', sun: 'zamkn' },
    gradient: 'linear-gradient(135deg,#ffd93d,#f0c419)',
    reviews: [
      { name: 'Janusz P.', rating: 5, text: 'Najlepszy bigos w Szczecinie! Jak za dawnych lat.', date: '2 dni temu' },
      { name: 'Ola K.', rating: 5, text: 'Tanio, smacznie, klimatycznie.', date: '4 dni temu' },
      { name: 'Tomek L.', rating: 4, text: 'Pierogi rewelacja, kolejki w porze obiadowej.', date: '1 tydz. temu' }
    ]
  },
  5: { // Apteka
    price: 2, featured: false, popular: false,
    hoursWeek: { mon: '8-20', tue: '8-20', wed: '8-20', thu: '8-20', fri: '8-20', sat: '9-15', sun: 'dyżur' },
    gradient: 'linear-gradient(135deg,#a29bfe,#8c7ae6)',
    reviews: [
      { name: 'Halina S.', rating: 4, text: 'Mili farmaceuci, szybka obsługa.', date: '3 dni temu' }
    ]
  },
  6: { // Szkoła
    price: 0, featured: false, popular: false,
    hoursWeek: { mon: '7-17', tue: '7-17', wed: '7-17', thu: '7-17', fri: '7-17', sat: 'zamkn', sun: 'zamkn' },
    gradient: 'linear-gradient(135deg,#fd79a8,#e84393)',
    reviews: [
      { name: 'Rodzic ucznia', rating: 4, text: 'Dobra kadra, nowoczesna sala gimnastyczna.', date: '1 tydz. temu' }
    ]
  },
  7: { // Siłownia plenerowa
    price: 0, featured: false, popular: true,
    hoursWeek: { mon: '0-24', tue: '0-24', wed: '0-24', thu: '0-24', fri: '0-24', sat: '0-24', sun: '0-24' },
    gradient: 'linear-gradient(135deg,#ff6b6b,#ee5a52)',
    reviews: [
      { name: 'Bartek F.', rating: 5, text: 'Codziennie tu ćwiczę. Za darmo i na świeżym powietrzu!', date: '1 dzień temu' },
      { name: 'Magda R.', rating: 4, text: 'Fajne urządzenia, czasem zajęte rano.', date: '6 dni temu' }
    ]
  },
  8: { // Pizzeria
    price: 2, featured: true, popular: true,
    hoursWeek: { mon: '12-23', tue: '12-23', wed: '12-23', thu: '12-23', fri: '12-23', sat: '12-23', sun: '12-23' },
    gradient: 'linear-gradient(135deg,#ffd93d,#f0c419)',
    reviews: [
      { name: 'Daniel W.', rating: 5, text: 'Pizza z pieca opalanego drewnem — wymiata!', date: '1 dzień temu' },
      { name: 'Ewa T.', rating: 5, text: 'Łosoś z kaparami to mistrzostwo. Szybka dostawa.', date: '3 dni temu' }
    ]
  },
  9: { // Poczta
    price: 1, featured: false, popular: false,
    hoursWeek: { mon: '8-18', tue: '8-18', wed: '8-18', thu: '8-18', fri: '8-18', sat: '8-13', sun: 'zamkn' },
    gradient: 'linear-gradient(135deg,#a29bfe,#8c7ae6)',
    reviews: [
      { name: 'Zofia B.', rating: 3, text: 'Bywają kolejki, ale obsługa ok.', date: '4 dni temu' }
    ]
  },
  10: { // Plac zabaw
    price: 0, featured: true, popular: true,
    hoursWeek: { mon: '0-24', tue: '0-24', wed: '0-24', thu: '0-24', fri: '0-24', sat: '0-24', sun: '0-24' },
    gradient: 'linear-gradient(135deg,#4ecdc4,#44a39b)',
    reviews: [
      { name: 'Mama Zuzi', rating: 5, text: 'Bezpieczny, ogrodzony, dzieci uwielbiają!', date: '2 dni temu' },
      { name: 'Krzysztof D.', rating: 5, text: 'Ścianka wspinaczkowa to hit.', date: '5 dni temu' }
    ]
  },
  11: { // Drogeria
    price: 1, featured: false, popular: false,
    hoursWeek: { mon: '9-20', tue: '9-20', wed: '9-20', thu: '9-20', fri: '9-20', sat: '9-18', sun: 'zamkn' },
    gradient: 'linear-gradient(135deg,#6bcb77,#5ab369)',
    reviews: [
      { name: 'Natalia C.', rating: 4, text: 'Duży wybór kosmetyków, przystępne ceny.', date: '3 dni temu' }
    ]
  },
  12: { // Przychodnia
    price: 0, featured: false, popular: false,
    hoursWeek: { mon: '7.5-18', tue: '7.5-18', wed: '7.5-18', thu: '7.5-18', fri: '7.5-18', sat: 'zamkn', sun: 'zamkn' },
    gradient: 'linear-gradient(135deg,#a29bfe,#8c7ae6)',
    reviews: [
      { name: 'Stanisław J.', rating: 4, text: 'Lekarz rodzinny bez kolejek, rejestracja online działa.', date: '1 tydz. temu' }
    ]
  }
};

// Merge extras into APP_DATA.places
function enrichPlaces() {
  if (typeof APP_DATA === 'undefined' || !APP_DATA.places) return;
  APP_DATA.places.forEach(p => {
    const extra = PLACES_EXTRA[p.id];
    if (extra) Object.assign(p, extra);

    // Load persisted user reviews from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('lucznicza_reviews_' + p.id) || '[]');
      if (stored.length) {
        p.reviews = stored.concat(p.reviews || []);
      }
    } catch {}

    // Recalculate rating from reviews if available
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

// ===== HELPER: GWIAZDKI =====
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

// ===== HELPER: STATUS OTWARTE / ZAMKNIĘTE =====
function getOpenStatus(place) {
  const hw = place.hoursWeek;
  if (!hw) return null;

  const now = new Date();
  const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = dayMap[now.getDay()];
  const range = hw[today];

  if (!range || range === 'zamkn') {
    return { open: false, label: 'Zamknięte', sub: 'Dziś nieczynne' };
  }
  if (range === '0-24') {
    return { open: true, label: 'Otwarte 24h', sub: 'Czynne całą dobę' };
  }
  if (range === 'dyżur') {
    return { open: true, label: 'Dyżur', sub: 'Dyżur weekendowy' };
  }

  const [openH, closeH] = range.split('-').map(parseFloat);
  const curH = now.getHours() + now.getMinutes() / 60;

  if (curH >= openH && curH < closeH) {
    const closesIn = closeH - curH;
    const sub = closesIn <= 1
      ? `Zamknięcie za ${Math.round(closesIn * 60)} min`
      : `Otwarte do ${formatHour(closeH)}`;
    return { open: true, label: 'Otwarte', sub };
  } else {
    const sub = curH < openH
      ? `Otwarcie o ${formatHour(openH)}`
      : `Otwarcie jutro o ${formatHour(openH)}`;
    return { open: false, label: 'Zamknięte', sub };
  }
}

function formatHour(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return mm ? `${hh}:${String(mm).padStart(2, '0')}` : `${hh}:00`;
}

// ===== HELPER: POZIOM CEN =====
function renderPriceLevel(price) {
  if (price === 0) return '<span class="price-free">Bezpłatne</span>';
  if (!price) return '';
  return '<span class="price-level">' + '💰'.repeat(price) + '</span>';
}

// ===== ULUBIONE (localStorage) =====
const FAVORITES_KEY = 'lucznicza_favorites';

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

function isFavorite(id) {
  return getFavorites().includes(id);
}

function toggleFavorite(id) {
  let favs = getFavorites();
  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
  } else {
    favs.push(id);
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  return favs.includes(id);
}

// ===== ODLEGŁOŚĆ =====
let USER_LOCATION = null;

function setUserLocation(lat, lng) {
  USER_LOCATION = { lat, lng };
}

function distanceToPlace(place) {
  if (!USER_LOCATION) return null;
  const R = 6371;
  const dLat = (place.coords[1] - USER_LOCATION.lat) * Math.PI / 180;
  const dLon = (place.coords[0] - USER_LOCATION.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(USER_LOCATION.lat * Math.PI/180) * Math.cos(place.coords[1] * Math.PI/180) *
    Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// Export
window.placesEnhanced = {
  renderStars,
  getOpenStatus,
  renderPriceLevel,
  getFavorites,
  isFavorite,
  toggleFavorite,
  setUserLocation,
  distanceToPlace,
  formatDistance,
  PLACES_EXTRA
};
