# Szczecin Guide Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER (Frontend PWA)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  index.html (UI)                                         │  │
│  │  ├─ app.js (3D map, navigation, POI)                    │  │
│  │  ├─ data.js (locations, routes, events)                │  │
│  │  ├─ live.js (weather, AQI, transport, clock)           │  │
│  │  ├─ style.css (responsive design, dark/light theme)    │  │
│  │  └─ sw.js (Service Worker for offline support)         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
            │                    │                    │
            │                    │                    │
            ▼                    ▼                    ▼
    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │ Mapbox GL    │     │  APIs        │     │  Vercel      │
    │  (3D Maps)   │     │ (Free)       │     │  Functions   │
    └──────────────┘     └──────────────┘     └──────────────┘
         │                    │                      │
         ▼                    ▼                      ▼
    ┌─────────────────────────────────────────────────────────┐
    │ BACKEND SERVICES                                        │
    ├─────────────────────────────────────────────────────────┤
    │ Open-Meteo API         ✓ Weather (temp, wind, UV, etc)  │
    │ Open-Meteo AQI         ✓ Air Quality (PM2.5, AQI)       │
    │ Nominatim API          ✓ Geocoding (location search)    │
    │ ZDiTM Szczecin API     ✓ Real-time transport (proxy)    │
    └─────────────────────────────────────────────────────────┘
```

---

## Component Layers

### 1️⃣ Presentation Layer (UI)
- **index.html**: Main interface with sections (Mapa, POI, Trasy, Na żywo)
- **style.css**: Responsive layout, dark/light themes, animations
- **Elements**: Cards, modals, widgets, live ticker

### 2️⃣ Application Logic
- **app.js**: Core app controller
  - Map initialization & interactions
  - Navigation between sections
  - POI filtering and display
  - Walking route visualization
  
- **data.js**: Static content
  - 12 POI (sport, food, shop, park, service, education)
  - 3 Walking routes (Kluczowa, Główna, Zabytkowa)
  - District information cards
  - Local events calendar

- **live.js**: Real-time data module
  - API calls to free services
  - Data caching & refresh logic
  - Live ticker updates
  - Weather, AQI, transport, clock

### 3️⃣ Offline Support
- **sw.js**: Service Worker
  - Caches app shell on first visit
  - Enables offline mode
  - Background sync ready

### 4️⃣ Backend Services

#### A) Weather & Environment (Open-Meteo)
```
┌─────────────────────────┐
│ Open-Meteo API          │
├─────────────────────────┤
│ /forecast               │ Current weather, 7-day forecast
│ /air-quality            │ AQI, pollutants (PM2.5, PM10, etc)
└─────────────────────────┘
```
- **Free**: No API key required
- **Rate limit**: ~1000 calls/hour
- **Refresh**: Every 10-15 min

#### B) Transport (ZDiTM via Vercel Proxy)
```
┌───────────────────────────────────────┐
│ Browser Request                       │
│ /api/zditm-departures?stops=...      │
└───────┬───────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ Vercel Serverless Function            │
│ /api/zditm-departures.js              │
│ (Handles CORS, caching, fallback)     │
└───────┬───────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ ZDiTM Szczecin API                    │
│ http://api.zditm.szczecin.pl/v1/      │
│ /stops, /displays/{stopId}            │
└───────────────────────────────────────┘
```
- **Real data**: Live departure times
- **Fallback**: Simulated data if unavailable
- **Caching**: 30 seconds per request

#### C) Geocoding (Nominatim)
- Optional: Search for locations by name
- Open Street Map service

---

## Data Flow

### Real-Time Updates (Na żywo section)

```
┌─────────────────┐
│ initLive()      │  Triggered when page loads
└────────┬────────┘
         │
         ├─→ startClock()               Updates every 1s
         │   └─→ UI: Current time/date
         │
         ├─→ fetchWeather()             Updates every 10 min
         │   │   (Open-Meteo API)
         │   ├─→ renderWeatherWidget()  Weather card
         │   ├─→ renderWeatherFull()    Full weather details
         │   └─→ renderForecast()       7-day forecast
         │
         ├─→ fetchAqi()                 Updates every 15 min
         │   │   (Open-Meteo Air Quality)
         │   ├─→ renderAqiWidget()      AQI meter
         │   └─→ renderAqiFull()        Pollutants breakdown
         │
         ├─→ generateTransportDepartures()  Updates every 1 min
         │   │   (ZDiTM via /api/zditm-departures)
         │   ├─→ renderTransportPanel() Live departures panel
         │   └─→ renderTransportFull()  Full departure list
         │
         └─→ buildTicker()              Scrolling live feed
             └─→ updateTicker()         Updates every 5 min
```

---

## Deployment Architecture

```
┌──────────────────────────────────────┐
│ GitHub Repository                    │
│ (catsy86-ops/Finanse)               │
└───────────────┬──────────────────────┘
                │ (Push to main branch)
                ▼
┌──────────────────────────────────────┐
│ Vercel (Auto-deploy)                 │
├──────────────────────────────────────┤
│ Build: npm install (just static)     │
│ Output:                              │
│ ├─ Static files (HTML, CSS, JS)      │
│ ├─ API functions (/api/*.js)         │
│ └─ Config (vercel.json, .env)        │
└───────────────┬──────────────────────┘
                │
                ▼
        https://szn-theta.vercel.app
        ├─ Regions: Global CDN
        ├─ SSL: Automatic (HTTPS)
        ├─ Caching: Smart defaults
        └─ Serverless: Instant scaling
```

---

## API Integration Points

| API | Endpoint | Frequency | Fallback |
|-----|----------|-----------|----------|
| **Open-Meteo Weather** | `/v1/forecast` | 10 min | Cached |
| **Open-Meteo AQI** | `/v1/air-quality` | 15 min | Cached |
| **ZDiTM Transport** | `/v1/stops`, `/displays/{id}` | 1 min | Simulated |
| **Nominatim Geocoding** | `/search` | Manual | N/A |

---

## Performance Optimizations

### 1. Caching Strategy
- **API responses**: 5-15 min in-memory cache
- **Static assets**: Browser caching via Service Worker
- **Vercel CDN**: 30s API response caching

### 2. Offline Support
- Service Worker caches app shell
- Works completely offline after first load
- Real-time data shows cached values

### 3. Network Efficiency
- Minimal API calls (grouped by feature)
- Gzip compression on all responses
- Responsive images (CSS-based scaling)
- Lazy-loaded map tiles

---

## Technologies Used

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, Vanilla JS | No build step, instant load |
| **Maps** | Mapbox GL JS v3 | 3D interactive maps |
| **Real-time** | Fetch API + intervals | Live data polling |
| **Offline** | Service Workers | PWA support |
| **Hosting** | Vercel + Serverless Fn | Deployment + proxy API |
| **APIs** | Open-Meteo, ZDiTM, Nominatim | External data sources |

---

## Security & Privacy

✅ **HTTPS everywhere** (Vercel auto-SSL)
✅ **No user data** collected or stored
✅ **CORS policies** enforced
✅ **API keys** not exposed (Mapbox token in HTML is public by design)
✅ **Service Worker** only caches app assets

---

## Future Architecture Considerations

### Potential Enhancements
- WebSocket for real-time vehicle tracking (instead of polling)
- Local storage persistence for user favorites
- IndexedDB for offline route caching
- Progressive enhancement for slower connections
- GraphQL API layer (if adding more complex queries)

### Scalability
- Vercel Functions auto-scale infinitely
- CDN handles traffic spikes
- Open APIs (Open-Meteo, ZDiTM) are production-grade
- No database = no scaling bottleneck

---

**Last Updated**: May 29, 2026
**Status**: Production-ready ✅
