# Real-Time ZDiTM API Integration

## Status: ✅ DEPLOYED TO VERCEL

Your Szczecin guide app now connects to real-time transport data from ZDiTM (Zarząd Dróg i Transportu Miejskiego w Szczecinie).

---

## What's New

### 🚀 Real-Time Transport Data
- **Live departures** from Łucznicza, Tarczowa, and Osiedle Łucznicza stops
- **Serverless API proxy** at `/api/zditm-departures` bypasses CORS restrictions
- **Graceful fallback** to simulated data if ZDiTM API is unavailable
- **Data source indicator** shows whether data is real (🟢) or simulated (🟡)

### 📡 How It Works

1. **Frontend Request**: App calls `/api/zditm-departures?stops=Łucznicza,Tarczowa`
2. **Vercel Serverless Function**: Proxy function routes request to ZDiTM API
3. **CORS Bypass**: Server-to-server communication avoids browser CORS restrictions
4. **Real-Time Data**: Returns actual tram and bus departure times
5. **Fallback Logic**: If ZDiTM API is down, returns realistic simulated data

### 📁 Files Changed

```
/api/zditm-departures.js     ← New: Vercel serverless proxy function
live.js                       ← Updated: Fetch from /api endpoint instead of direct API
vercel.json                   ← Updated: Configure API routes and caching
```

---

## Deployment

- **Deployed to**: https://szn-theta.vercel.app
- **Trigger**: Auto-deploys on git push
- **Live**: Real-time data fetching now active

### Testing the Integration

Click "Odjazdy 🚌" in the app to see:
- Real departures (when ZDiTM API is available)
- Data source badge: 🟢 ZDiTM (live) or 🟡 Symulowane
- Timestamps showing when data was last updated

---

## Technical Details

### Serverless Function: `/api/zditm-departures.js`

**Endpoint**: `/api/zditm-departures?stops=name1,name2`

**Response** (JSON):
```json
{
  "source": "zditm-real" | "simulated",
  "timestamp": "2026-05-29T20:58:00.000Z",
  "departures": [
    {
      "line": "3",
      "type": "tram",
      "dest": "Centrum",
      "stop": "Łucznicza",
      "minsLeft": 5,
      "time": "21:03",
      "realtime": true
    },
    ...
  ]
}
```

**Features**:
- Fetches list of stops from ZDiTM API
- Matches user-requested stops to actual stop IDs
- Retrieves real-time departure data from `/displays/{stopId}` endpoint
- Calculates minutes until departure
- Caches responses for 30 seconds (prevents excessive API calls)
- Falls back to simulated data on API error

### Error Handling

The function never crashes the app:
- ✅ ZDiTM API available → Real data
- ⚠️ ZDiTM API error → Simulated data (same format)
- ✅ App always shows departures

---

## ZDiTM API Details

**Base URL**: `http://api.zditm.szczecin.pl/v1/`

**Endpoints**:
- `GET /stops` — List all tram/bus stops in Szczecin
- `GET /displays/{stopId}` — Real-time departures for stop

**Coverage**:
- 95 routes (tramwaje + autobusy)
- 1493 stops throughout Szczecin
- Real-time updates every 30 seconds

---

## Future Enhancements

- [ ] Add vehicle tracking (real-time bus/tram location on map)
- [ ] Show predicted arrival times (delays/early arrivals)
- [ ] Favorite stops (save frequently used stops)
- [ ] Route planning (multi-stop journeys)
- [ ] Notifications for incoming trams/buses
- [ ] Integration with other APIs (traffic, disruptions)

---

## Local Development

To test locally:

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Open app**:
   ```
   http://localhost:3000
   ```

3. **Note**: Vercel serverless functions don't work locally.
   - Departures will use simulated data in dev
   - Real data works on deployed version

---

## Support

If transport data doesn't show:
1. Check app console for errors (F12)
2. Verify internet connection
3. Try clicking "Odśwież" button in transport panel
4. If ZDiTM API is down, simulated data is used as fallback

---

## Deploy to Vercel

App auto-deploys on `git push`:
```bash
git push
# Vercel automatically builds and deploys changes
# Check: https://szn-theta.vercel.app
```

---

**Built with**: Vercel serverless functions, Open-Meteo API, Mapbox GL JS
**Last updated**: May 29, 2026
