# 🏹 Przewodnik Łucznicza & Tarczowa — Szczecin

Interaktywna aplikacja webowa (PWA) z mapą 3D i danymi na żywo dla dzielnicy Łucznicza/Tarczowa w Szczecinie.

**🌐 Live App**: https://szn-theta.vercel.app

## 🚀 Uruchomienie

### Opcja 1 — Live Server (zalecane)
```bash
# Zainstaluj Live Server (VS Code extension) lub:
npx serve .
# Otwórz: http://localhost:3000
```

### Opcja 2 — Python
```bash
python -m http.server 8080
# Otwórz: http://localhost:8080
```

### Opcja 3 — Bezpośrednio
Otwórz `index.html` w przeglądarce (mapa może nie działać bez serwera HTTP).

---

## 🗝️ Klucz Mapbox API

Aplikacja używa demonstracyjnego tokenu Mapbox. Aby uzyskać własny (bezpłatny):

1. Zarejestruj się na [mapbox.com](https://mapbox.com)
2. Skopiuj swój **Public Token** z dashboardu
3. W pliku `app.js` zamień linię:
   ```js
   mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94...';
   ```
   na swój token.

---

## ✨ Funkcje

| Funkcja | Opis | Status |
|---------|------|--------|
| 🗺️ Mapa 3D | Interaktywna mapa 3D z budynkami (Mapbox Standard) | ✅ Live |
| 📍 Markery | 12 punktów POI z kategoriami | ✅ Live |
| 🚶 Trasy | 3 trasy spacerowe z wizualizacją | ✅ Live |
| 🌙 Dark/Light | Przełączanie motywu | ✅ Live |
| 🌡️ Pogoda na żywo | Bieżąca pogoda + prognoza 7-dniowa (Open-Meteo) | ✅ Live |
| 🌬️ Jakość powietrza | AQI + PM2.5, PM10, NO₂ (Open-Meteo) | ✅ Live |
| ⏰ Zegar | Bieżący czas + data | ✅ Live |
| 🌅 Wschód/zachód | Czas wschodu/zachodu słońca | ✅ Live |
| 🚌 Transport | **Odjazdy na żywo** (ZDiTM API via Vercel) | ✅ **NEW** ⭐ |
| 📱 PWA | Instalowalna jako aplikacja | ✅ Live |
| 📡 Offline | Pełna funkcjonalność bez internetu | ✅ Live |

## 📊 Dane Na Żywo (Na żywo Tab)

### 🌡️ Pogoda (Open-Meteo API)
- Bieżąca temperatura, "odczuwalna", wilgotność, wiatr, ciśnienie
- Prognoza 7-dniowa z min/max temperaturami
- Indeks UV i opady
- **Aktualizacja**: Każde 10 minut

### 🌬️ Jakość powietrza (Open-Meteo Air Quality)
- Europejski indeks AQI
- PM2.5, PM10 (pyły stałe)
- NO₂ (tlenek azotu)
- Ozon (O₃)
- Rekomendacje zdrowotne
- **Aktualizacja**: Każde 15 minut

### 🚌 Odjazdy Transportu (ZDiTM via Vercel) ⭐ NEW
- **Linie tramwajowe**: 3, 7, 12
- **Linie autobusowe**: 51, 64, 78, 103, N1
- **Przystanki**: Łucznicza, Tarczowa, Osiedle Łucznicza
- **Dane**: Rzeczywisty czas odjazdu, kierunek
- **Status**: 🟢 ZDiTM (live) / 🟡 Symulowane (fallback)
- **Aktualizacja**: Każdy 1 minuta
- **Jak działa**: Vercel serverless function proxy (omija CORS)

### 🌅 Wschód/zachód słońca
- Dokładne czasy dla bieżącego dnia
- Długość dnia

### ⏰ Zegar na żywo
- Aktualna godzina z sekundami
- Data w polszczyźnie (dzień, liczba, miesiąc)
- **Aktualizacja**: Co sekundę

---

---

## 🔧 Nowe: Integracja ZDiTM API

### Problem Rozwiązany
- ❌ ZDiTM API blokuje bezpośrednie żądania z przeglądarki (CORS)
- ✅ Rozwiązanie: Vercel serverless function (proxy)

### Jak to działa
1. Aplikacja wysyła żądanie do `/api/zditm-departures`
2. Vercel function odbiera żądanie
3. Function komunikuje się z ZDiTM API (server-to-server, bez CORS)
4. Zwraca rzeczywisty czas odjazdu
5. Jeśli ZDiTM niedostępne → graceful fallback do danych symulowanych

### Pliki
```
api/
└── zditm-departures.js    Vercel serverless proxy function
live.js                    (Updated) Fetch z proxy endpoint
vercel.json                (Updated) Konfiguracja API
```

### Wskaźnik Źródła Danych
- **🟢 ZDiTM (live)** — Rzeczywiste dane z API
- **🟡 Symulowane** — Dane fallback (ZDiTM niedostępny)

---

## 📁 Struktura

```
szn/
├── api/
│   └── zditm-departures.js     Vercel serverless proxy (NEW)
├── index.html                  Główny plik HTML
├── style.css                   Style CSS (dark/light theme)
├── app.js                      Logika aplikacji + Mapbox
├── data.js                     Dane miejsc, tras, wydarzeń
├── live.js                     Real-time data (weather, AQI, transport)
├── manifest.json               PWA manifest
├── sw.js                       Service Worker (offline)
├── vercel.json                 Deployment config (API routes)
└── README.md
```

## 🛠️ Technologie

- **Mapbox GL JS v3.4** — mapa 3D z WebGL
- **Mapbox Standard Style** — nowoczesny styl z budynkami 3D
- **Vanilla JS** — bez frameworków, szybkie ładowanie
- **CSS Custom Properties** — dynamiczne motywy
- **PWA** — Service Worker + Web App Manifest
- **Google Fonts** — Inter + Playfair Display


## 🛠️ Technologie

- **Frontend**: HTML5, Vanilla JS, CSS3
- **Mapy**: Mapbox GL JS v3 (3D z WebGL)
- **Real-time APIs**: 
  - Open-Meteo Weather (bezpłatny, bez klucza)
  - Open-Meteo Air Quality (bezpłatny, bez klucza)
  - ZDiTM Szczecin (via Vercel proxy)
- **Deployment**: Vercel (serverless functions + CDN)
- **Offline**: Service Worker + Web App Manifest (PWA)
- **Styling**: CSS Custom Properties (dynamiczne motywy)

---

## 📚 Dokumentacja

Więcej informacji znaleźć można w:
- `REAL_TIME_API_INTEGRATION.md` — Integracja ZDiTM API
- `ARCHITECTURE.md` — Architektura systemu
- `QUICK_REFERENCE.md` — Szybka instrukcja
- `DEPLOYMENT_SUMMARY.txt` — Podsumowanie wdrożenia

---

**Status**: ✅ Production-ready
**URL**: https://szn-theta.vercel.app
**Ostatnia aktualizacja**: 29 maja 2026
