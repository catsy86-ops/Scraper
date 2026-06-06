/**
 * place-images.js — Zdjęcia miejsc
 * Używa Wikimedia Commons + Picsum jako fallback
 * Bezpłatne, bez klucza API
 */
'use strict';

// Mapowanie kategorii/nazw na prawdziwe zdjęcia z Wikimedia Commons
// Format: URL do miniaturki (bezpośredni link do pliku)
const PLACE_IMAGES = {
  // Konkretne miejsca po nazwie
  'Biedronka':          'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Biedronka_logo.svg/200px-Biedronka_logo.svg.png',
  'Lidl':               'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Lidl-Logo.svg/200px-Lidl-Logo.svg.png',
  "McDonald's":         'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/200px-McDonald%27s_Golden_Arches.svg.png',
  'Żabka':              'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Zabka_logo.svg/200px-Zabka_logo.svg.png',
  'Pizza Hut':          'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Pizza_Hut_logo.svg/200px-Pizza_Hut_logo.svg.png',
  'Apteka Puls':        null,
  'Apteka Fiołkowa':    null,
  'Apteka Dbam o Zdrowie': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Dbam_o_Zdrowie_logo.svg/200px-Dbam_o_Zdrowie_logo.svg.png',
  'Bank Pekao':         'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Bank_Pekao_logo.svg/200px-Bank_Pekao_logo.svg.png',
  'Bank Millennium':    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Bank_Millennium_logo.svg/200px-Bank_Millennium_logo.svg.png',
  'Santander Bank Polska': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Santander_logo.svg/200px-Santander_logo.svg.png',
};

// Kategorie → zdjęcia z Picsum (deterministyczne ID = zawsze to samo zdjęcie)
const CAT_IMAGES = {
  park:    'https://picsum.photos/seed/park-szczecin/400/200',
  sport:   'https://picsum.photos/seed/sport-field/400/200',
  food:    'https://picsum.photos/seed/food-restaurant/400/200',
  shop:    'https://picsum.photos/seed/shop-store/400/200',
  service: 'https://picsum.photos/seed/service-building/400/200',
  edu:     'https://picsum.photos/seed/school-building/400/200',
};

// Specjalne zdjęcia per amenity type
const AMENITY_IMAGES = {
  pharmacy:    'https://picsum.photos/seed/pharmacy-store/400/200',
  bank:        'https://picsum.photos/seed/bank-building/400/200',
  post_office: 'https://picsum.photos/seed/post-office/400/200',
  dentist:     'https://picsum.photos/seed/dental-clinic/400/200',
  bakery:      'https://picsum.photos/seed/bakery-bread/400/200',
  cafe:        'https://picsum.photos/seed/cafe-coffee/400/200',
  pizza:       'https://picsum.photos/seed/pizza-restaurant/400/200',
  kebab:       'https://picsum.photos/seed/kebab-food/400/200',
  library:     'https://picsum.photos/seed/library-books/400/200',
  church:      'https://picsum.photos/seed/church-building/400/200',
  kindergarten:'https://picsum.photos/seed/kindergarten-kids/400/200',
  school:      'https://picsum.photos/seed/school-classroom/400/200',
  florist:     'https://picsum.photos/seed/flower-shop/400/200',
  confectionery:'https://picsum.photos/seed/cake-pastry/400/200',
};

function getPlaceImage(place) {
  // 1. Check by exact name
  for (const [key, url] of Object.entries(PLACE_IMAGES)) {
    if (place.name.includes(key) && url) return url;
  }
  // 2. Check by amenity type
  const amenity = place.amenity || '';
  if (AMENITY_IMAGES[amenity]) return AMENITY_IMAGES[amenity];
  // 3. Check by tags
  const tags = place.tags || [];
  if (tags.includes('piekarnia') || tags.includes('pieczywo')) return AMENITY_IMAGES.bakery;
  if (tags.includes('pizza')) return AMENITY_IMAGES.pizza;
  if (tags.includes('kebab')) return AMENITY_IMAGES.kebab;
  if (tags.includes('apteka')) return AMENITY_IMAGES.pharmacy;
  if (tags.includes('bank')) return AMENITY_IMAGES.bank;
  if (tags.includes('poczta')) return AMENITY_IMAGES.post_office;
  if (tags.includes('dentysta') || tags.includes('stomatolog')) return AMENITY_IMAGES.dentist;
  if (tags.includes('biblioteka')) return AMENITY_IMAGES.library;
  if (tags.includes('kościół')) return AMENITY_IMAGES.church;
  if (tags.includes('przedszkole')) return AMENITY_IMAGES.kindergarten;
  if (tags.includes('szkoła')) return AMENITY_IMAGES.school;
  if (tags.includes('kwiaciarnia')) return AMENITY_IMAGES.florist;
  if (tags.includes('cukiernia') || tags.includes('torty')) return AMENITY_IMAGES.confectionery;
  // 4. Fallback to category
  return CAT_IMAGES[place.cat] || CAT_IMAGES.service;
}

// Inject images into place cards
function injectPlaceImages() {
  if (!APP_DATA?.places) return;
  APP_DATA.places.forEach(p => {
    if (!p.image) p.image = getPlaceImage(p);
  });
}

// Call on load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(injectPlaceImages, 100);
});

window.placeImages = { getPlaceImage, injectPlaceImages };
