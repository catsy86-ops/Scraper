# Quick Reference Guide

## 🚀 Live App
**URL**: https://szn-theta.vercel.app

---

## 📋 Key Features

| Feature | Status | How to Use |
|---------|--------|-----------|
| **3D Map** | ✅ Live | Pan, zoom, rotate • Click buildings • Toggle dark/light |
| **POI** | ✅ Live | Click "Atrakcje" tab • Filter by category • Click marker for details |
| **Routes** | ✅ Live | Click "Trasy" tab • Select route • See on map + directions |
| **Weather** | ✅ Live | Click "Na żywo" tab • See current + 7-day forecast |
| **Air Quality** | ✅ Live | "Na żywo" tab • AQI meter + pollutants breakdown |
| **Transport** | ✅ Live | Click "Odjazdy 🚌" button • Real-time departures • Refresh to update |

---

## 🔧 Real-Time Data Sources

### Weather (Open-Meteo)
- Updates: Every 10 minutes
- Shows: Temp, feels-like, humidity, wind, pressure, UV
- 7-day forecast included

### Air Quality (Open-Meteo)
- Updates: Every 15 minutes
- Shows: AQI, PM2.5, PM10, NO₂, Ozone, CO
- Health recommendations

### Transport (ZDiTM via Vercel Proxy) ⭐
- Updates: Every 1 minute
- Shows: Live tram/bus departures
- Lines: 3, 7, 12, 51, 64, 78, 103, N1
- Stops: Łucznicza, Tarczowa, Osiedle Łucznicza
- Badge: 🟢 Real (live API) vs 🟡 Simulated (fallback)

---

## 💾 Local Development

```bash
# Start dev server
npm run dev

# Open browser
http://localhost:3000

# Build for production
npm run build

# Deploy (auto-triggers on git push)
git push origin main
```

---

## 📱 Features

### On Dashboard
- Weather widget (top right) — Current conditions
- Clock (top center) — Time + date
- AQI meter (top left) — Air quality level
- Transport button (bottom right) — Live departures

### Tabs
1. **Mapa** — 3D map + POI visualization
2. **Atrakcje** — Points of interest (12 locations)
3. **Trasy** — Walking routes (3 routes)
4. **Na żywo** — Real-time data (weather, AQI, transport, calendar)
5. **Ustawienia** — Settings (dark/light mode)

### Transport Panel
- Shows next 12 departures
- Red "🚌 Teraz" = arriving now
- Minutes count down
- Click "Odśwież" to update immediately

---

## ⚡ Performance Tips

- **First load**: ~2-3 seconds (includes map tiles)
- **Cached loads**: <500ms
- **Offline**: Works fully (uses cached data)
- **Mobile**: Optimized for all screen sizes
- **Dark mode**: Default (toggle in Settings)

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Transport not showing | Click "Odśwież" button • Wait 30s • Check internet |
| Weather outdated | Wait 10 min for refresh • Click "Odśwież" button |
| App slow | Clear browser cache • Refresh page • Check internet |
| Offline doesn't work | Visit app online first (caches assets) |
| Map not loading | Check Mapbox token • Try another browser |

---

## 📂 Important Files

```
szn/
├── index.html          Main app file
├── app.js              Map & navigation logic
├── live.js             Real-time data (weather, AQI, transport)
├── style.css           UI styling
├── sw.js               Offline support
├── api/
│   └── zditm-departures.js   Proxy for transport API
└── vercel.json         Deployment config
```

---

## 🔐 Security & Privacy

✅ HTTPS only
✅ No user data stored
✅ No tracking
✅ APIs require no login
✅ Mapbox public token (by design)

---

## 📞 Support

**Real-time data not updating?**
1. Check internet connection
2. Click "Odśwież" button
3. Wait for automatic refresh (10-15 min)

**App crashing?**
1. Clear browser cache
2. Force refresh (Ctrl+Shift+R)
3. Try different browser

**Need to report bug?**
Check browser console (F12) for errors

---

## 🚀 Deployment

Auto-deploys on `git push`:

```bash
git add .
git commit -m "Your message"
git push origin main
# Vercel auto-builds & deploys
# Live in ~1-2 minutes
```

---

## 📊 Data Refresh Intervals

| Data | Interval | Manual Refresh |
|------|----------|-----------------|
| Weather | 10 min | "Odśwież" button |
| AQI | 15 min | "Odśwież" button |
| Transport | 1 min | "Odśwież" or button click |
| Ticker | 5 min | Auto (no action needed) |

---

## 🎨 UI Elements

- **Dark mode** (default) — Easier on eyes
- **Light mode** — Toggle in Settings
- **Responsive** — Works on all devices
- **Accessible** — Keyboard navigation
- **Fast** — No heavy frameworks

---

## 💡 Tips & Tricks

1. **Offline mode**: Visit app once online, works anywhere
2. **Install app**: Click "Install" prompt (home screen)
3. **Share location**: Click map for directions
4. **Dark mode**: Default for 8pm-6am
5. **Real-time ticker**: Scrolls continuously at bottom

---

## 📈 Next Steps

Future enhancements:
- Vehicle tracking on map
- Push notifications for departures
- Route planning (multi-stop)
- Service disruption alerts
- Photo gallery for POI

---

**Last Updated**: May 29, 2026
**Status**: ✅ Live & Production-Ready
