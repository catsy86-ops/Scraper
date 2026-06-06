# 🗺️ Status naprawy mapy — notatka na później

Data: 29 maja 2026

## Problem
"Dalej szare tło i punkty" — markery (punkty POI) pokazują się na mapie,
ale kafelki tła (tiles) są szare / nie ładują się.

## Diagnoza
To klasyczny objaw Leaflet: mapa inicjalizuje się zanim kontener `#map`
ma swój ostateczny rozmiar (mapa tworzona jest tuż po zniknięciu splash screena),
więc Leaflet liczy rozmiar = 0 i NIE pobiera obrazków kafelków.
Markery działają, bo są pozycjonowane po współrzędnych geo, a nie po pikselach.

## Co już zostało zrobione (wdrożone na produkcję — commit `41a53e1`)
1. **`app.js`** — dodane `map.invalidateSize(true)` w 3 odstępach (200ms, 600ms, 1200ms)
   + listener na `resize`. To wymusza przeliczenie rozmiaru i pobranie kafelków.
2. **`app.js`** — zmiana głównych kafelków na CARTO Voyager (szybsze, CORS-friendly)
   z automatycznym fallbackiem na OpenStreetMap przy błędach (`tileerror`).
3. **`index.html`** — USUNIĘTE `style="background: #f0f0f0"` z diva `#map`
   (to był dosłownie ten szary kolor, który było widać).
4. **`style.css`** — `.leaflet-container` ma teraz tło `#aadaff` (niebieskie jak woda)
   zamiast szarego, podczas ładowania kafelków + poprawione z-index paneli Leaflet.
5. **`sw.js`** — przepisany Service Worker (v3): network-first dla kodu,
   kafelki map omijają cache (przechodzą prosto do sieci).
6. **`index.html`** — dodany skrypt czyszczący stary Service Worker + cache
   ze starej wersji Mapbox.

## ⏳ Co sprawdzić następnym razem (jeśli NADAL szare)
Otwórz https://szn-theta.vercel.app w trybie incognito (żeby ominąć cache)
i otwórz konsolę przeglądarki (F12). Sprawdź:

1. **Zakładka Network** → filtr "img" → czy są requesty do `basemaps.cartocdn.com`
   lub `tile.openstreetmap.org`?
   - Jeśli requestów BRAK → problem z rozmiarem kontenera (invalidateSize nie działa).
     Rozwiązanie: wywołać `initMap()` dopiero po `navigateTo('map')` albo dodać
     `map.whenReady(() => map.invalidateSize())`.
   - Jeśli requesty są CZERWONE (403/błąd) → tile server blokuje. Zmienić providera.

2. **Zakładka Console** → szukać:
   - `⚠️ CARTO tiles failing` → fallback na OSM się włączył, ale OSM też nie działa?
   - błędów CORS / CSP.

3. **Sprawdzić wysokość kontenera**: w konsoli wpisać
   `document.getElementById('map').clientHeight`
   - Jeśli zwraca `0` → to jest przyczyna. Kontener nie ma wysokości w momencie initu.
     Sprawdzić CSS: `.main`, `.section`, `.section.active`, `.map-container`, `#map`.

## Pomysły zapasowe (gdyby invalidateSize nie wystarczył)
- A) Przenieść `initMap()` tak, by uruchamiał się przy pierwszym wejściu w sekcję Mapa,
  nie od razu po splash.
- B) Użyć `ResizeObserver` na kontenerze `#map` → `invalidateSize()` przy każdej zmianie.
- C) Dać `#map` sztywną wysokość w px (np. `calc(100vh - 64px - 72px)`) zamiast `100%`,
  żeby nie zależeć od flexbox layout parenta.

## Pliki kluczowe
- `app.js` — funkcja `initMap()` (ok. linia 64+)
- `index.html` — div `#map` (ok. linia 125), skrypty na dole
- `style.css` — `.map-container`, `#map`, `.leaflet-container` (sekcja na końcu pliku)
- `sw.js` — Service Worker

## Deploy
- URL: https://szn-theta.vercel.app
- Auto-deploy włączony przy `git push`
- Ostatni commit: `41a53e1`


---

## AKTUALIZACJA — sesja kontynuacji

Wdrożone kolejne poprawki (przyczyna regresji znaleziona):
1. **USUNIĘTE `crossOrigin: true`** z warstw kafelków w `app.js`.
   To był prawdopodobny winowajca: gdy serwer kafelków nie wysyła nagłówków CORS,
   obrazki ładują się, ale przeglądarka ich NIE wyświetla (szare tło), a markery działają.
2. **OSM znów głównym providerem** (najbardziej niezawodny), CARTO jako fallback przy `tileerror`.
3. **`ResizeObserver`** na kontenerze `#map` → `invalidateSize()` gdy kontener dostaje realny rozmiar.
4. **`map.whenReady()`** + dodatkowe `invalidateSize` w 100/500/1500 ms.
5. **CSS**: `.map-container` ma `position: absolute; inset: 0`, `#map` ma `min-height: 300px`.
6. **SW bump do v4** + log wysokości kontenera w konsoli.

Po wdrożeniu: otwórz w incognito, w konsoli powinien być log
`✨ Mapa Leaflet gotowa! Wysokość kontenera: <liczba>`. Jeśli liczba > 0 i dalej szaro,
to problem jest po stronie tile servera (sprawdź zakładkę Network).
